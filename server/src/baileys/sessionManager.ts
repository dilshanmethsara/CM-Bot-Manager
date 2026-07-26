import makeWASocket, {
  DisconnectReason,
  makeCacheableSignalKeyStore,
  type WASocket,
  type ConnectionState,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import PQueue from 'p-queue';
import prisma from '../prisma.js';
import { BaileysAuthStore } from './authStore.js';
import { formatForPairing } from '../utils/phone.js';
import { serverIO } from '../socketServer.js';
import { createSessionLog, logger } from '../logger.js';

// Use global WebSocket for ready state checking
const WebSocket = globalThis.WebSocket;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 3000;

interface SessionInfo {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr' | 'pairing';
  profileName?: string | null;
  avatarUrl?: string | null;
  connectedAt?: Date | null;
  lastActivity?: Date | null;
  qrCode?: string;
  pairingCode?: string;
}

interface BaileysSession {
  socket: WASocket;
  authStore: BaileysAuthStore;
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
  connectingGuard: boolean;
  messageQueue: PQueue;
}

class SessionManager {
  private sessions = new Map<string, BaileysSession>();
  private qrCodes = new Map<string, string>();
  private pairingCodes = new Map<string, string>();

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    // Mark all active sessions as disconnected on startup
    await prisma.session.updateMany({
      where: { status: { in: ['connected', 'connecting', 'qr', 'pairing'] } },
      data: { status: 'disconnected' },
    });

    // Restore sessions that have stored credentials
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { credentialsEncrypted: { not: null } },
          { keysEncrypted: { not: null } },
        ],
      },
    });

    for (const session of sessions) {
      this.connect(session.id, false).catch((err) =>
        logger.error({ sessionId: session.id, err }, 'Failed to restore session')
      );
    }

    logger.info({ count: sessions.length }, 'Session manager initialized');
  }

  // ─── Create / Delete ──────────────────────────────────────────────────────

  async createSession(id: string, name: string, phoneNumber: string): Promise<SessionInfo> {
    const existing = await prisma.session.findUnique({ where: { id } });
    if (existing) throw new Error(`Session ${id} already exists`);

    // Validate phone number
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      throw new Error('Invalid phone number format');
    }

    const session = await prisma.session.create({
      data: { id, name, phoneNumber: digits, status: 'disconnected' },
    });

    await createSessionLog(id, 'INFO', `Session created: ${name}`);

    const info = this.toSessionInfo(session);
    serverIO?.emit('sessionCreated', info);
    return info;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');

    // Cancel reconnects
    this.cancelReconnect(sessionId);

    // Close socket gracefully
    const baileysSession = this.sessions.get(sessionId);
    if (baileysSession?.socket) {
      try {
        await baileysSession.socket.logout();
      } catch {
        // ignore
      }
    }

    // Clear auth from database
    if (baileysSession?.authStore) {
      await baileysSession.authStore.clear();
    }

    this.sessions.delete(sessionId);
    this.qrCodes.delete(sessionId);
    this.pairingCodes.delete(sessionId);

    await prisma.session.delete({ where: { id: sessionId } });
    await createSessionLog(sessionId, 'INFO', 'Session deleted');

    serverIO?.emit('sessionDeleted', { sessionId });
  }

  // ─── Connect / Disconnect ─────────────────────────────────────────────────

  async connect(sessionId: string, usePairingCode = false): Promise<void> {
    // Prevent concurrent connect calls
    const existing = this.sessions.get(sessionId);
    if (existing?.connectingGuard) {
      logger.warn({ sessionId }, 'Connect already in progress, skipping');
      return;
    }

    try {
      // Cancel any pending reconnect
      this.cancelReconnect(sessionId);

      // Cleanup existing socket
      if (existing?.socket) {
        try {
          existing.socket.end(undefined);
        } catch {
          // ignore
        }
      }

      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) throw new Error('Session not found');

      await this.updateStatus(sessionId, 'connecting');

      // Create auth store
      const authStore = new BaileysAuthStore(sessionId);
      const authState = await authStore.load();

      // If no creds exist, we're starting fresh - that's fine
      if (!authState.creds) {
        logger.info({ sessionId }, 'No existing credentials, starting fresh');
      }

      // Create message queue for rate limiting
      const messageQueue = new PQueue({ concurrency: 1, interval: 100, intervalCap: 10 });

      // Create socket with proper configuration
      const socket = makeWASocket({
        auth: {
          creds: authState.creds,
          keys: makeCacheableSignalKeyStore(authState.keys, logger as any),
        },
        printQRInTerminal: false,
        logger: logger as any,
        browser: Browsers.windows('Chrome'),
        markOnlineOnConnect: false,
        getMessage: async (key) => undefined,
        cachedGroupMetadata: async (jid) => undefined,
      });

      // Create session wrapper
      const baileysSession: BaileysSession = {
        socket,
        authStore,
        reconnectAttempts: 0,
        reconnectTimer: null,
        connectingGuard: true,
        messageQueue,
      };

      this.sessions.set(sessionId, baileysSession);

      // ─── Pairing code flow (only for fresh unpaired sessions) ────────────
      if (usePairingCode) {
        if (authState.creds?.registered) {
          logger.info({ sessionId }, 'Skipping pairing code — session already registered');
          await createSessionLog(sessionId, 'INFO', 'Already registered, skipping pairing code');
        } else {
          // Wait for WebSocket to establish (connection becomes 'connecting' or 'open'), then request pairing code
          let pairingRequested = false;
          
          const checkAndRequestPairing = async () => {
            if (pairingRequested) return;
            
            // Double-check: still not registered (creds may have updated)
            if (authState.creds?.registered) {
              logger.info({ sessionId }, 'creds already registered, skipping pairing request');
              return;
            }
            
          // Only request if socket is connected (not closed)
            // socket.ws is WebSocketClient – uses isOpen/isConnecting getters, not readyState
            const ws = socket.ws as any;
            if (ws && (ws.isOpen || ws.isConnecting)) {
              pairingRequested = true;
              try {
                const phoneDigits = formatForPairing(session.phoneNumber);
                logger.info({ sessionId, phone: phoneDigits, wsState: ws.isOpen ? 'open' : 'connecting' }, 'Requesting pairing code');
                await createSessionLog(sessionId, 'INFO', `Requesting pairing code for ${phoneDigits}`);
                const code = await socket.requestPairingCode(phoneDigits);
                const formatted = typeof code === 'string'
                  ? code.match(/.{1,4}/g)?.join('-') ?? code
                  : String(code);
                this.pairingCodes.set(sessionId, formatted);
                await this.updateStatus(sessionId, 'pairing');
                serverIO?.emit('pairingCodeGenerated', { sessionId, pairingCode: formatted });
                await createSessionLog(sessionId, 'INFO', `Pairing code generated: ${formatted}`);
                logger.info({ sessionId, code: formatted, wsOpen: ws.isOpen }, 'Pairing code ready');
              } catch (err) {
                pairingRequested = false; // Allow retry
                await createSessionLog(sessionId, 'ERROR', `Pairing request failed: ${err}`);
                logger.error({ sessionId, err, wsOpen: ws?.isOpen }, 'Pairing request failed');
              }
            } else {
              // Socket not ready yet, check again in 1 second
              logger.debug({ sessionId, wsOpen: ws?.isOpen, wsConnecting: ws?.isConnecting }, 'Socket not ready for pairing, retrying...');
              setTimeout(checkAndRequestPairing, 1000);
            }
          };
          
          // Start checking after a short delay
          setTimeout(checkAndRequestPairing, 1500);
        }
      }

      // ─── Connection Events ────────────────────────────────────────────────
      socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr, isNewLogin, receivedPendingNotifications } = update;
        
        logger.info({ 
          sessionId, 
          connection, 
          isNewLogin, 
          receivedPendingNotifications,
          lastDisconnectError: lastDisconnect?.error?.message,
          lastDisconnectStatusCode: (lastDisconnect?.error as Boom)?.output?.statusCode,
          lastDisconnectReason: (lastDisconnect?.error as Boom)?.output?.statusCode ? 
            (DisconnectReason[(lastDisconnect?.error as Boom)?.output?.statusCode!] || `code_${(lastDisconnect?.error as Boom)?.output?.statusCode}`) : 'none',
        }, 'connection.update event');
        
        await createSessionLog(sessionId, 'INFO', `connection.update: ${connection ?? 'no-change'}`);

        if (qr) {
          this.qrCodes.set(sessionId, qr);
          await this.updateStatus(sessionId, 'qr');
          serverIO?.emit('qrCodeGenerated', { sessionId, qrCode: qr });
          await createSessionLog(sessionId, 'INFO', 'QR code generated');
          logger.info({ sessionId, qrLength: qr.length }, 'QR code ready');
        }

        if (connection === 'connecting') {
          logger.info({ sessionId, receivedPendingNotifications }, 'connection.update: connecting');
          baileysSession.connectingGuard = false;
          await this.updateStatus(sessionId, 'connecting');
        }

        if (connection === 'open') {
          logger.info({ sessionId, isNewLogin, receivedPendingNotifications }, 'connection.update: open — WhatsApp linked!');
          this.qrCodes.delete(sessionId);
          this.pairingCodes.delete(sessionId);
          baileysSession.reconnectAttempts = 0;
          baileysSession.connectingGuard = false;

          // Save creds immediately (critical: ensures keys/creds persisted after pairing)
          await authStore.saveCreds();

          const name = socket.user?.name || socket.user?.verifiedName || null;

          await prisma.session.update({
            where: { id: sessionId },
            data: {
              status: 'connected',
              profileName: name,
              connectedAt: new Date(),
              lastActivity: new Date(),
              credentialsEncrypted: null,
              keysEncrypted: null,
            },
          }).catch(() => {
            // session may already be deleted
          });

          // Pull profile picture asynchronously
          try {
            const jid = socket.user?.id ?? '';
            if (jid) {
              const picUrl = await socket.profilePictureUrl(jid, 'image');
              if (picUrl) {
                await prisma.session.update({
                  where: { id: sessionId },
                  data: { avatarUrl: picUrl },
                }).catch(() => {});
              }
            }
          } catch {
            // non-critical — user may not have profile pic
          }

          const updated = await prisma.session.findUnique({ where: { id: sessionId } });
          const info = this.toSessionInfo(updated!);
          serverIO?.emit('sessionConnected', info);
          serverIO?.emit('connection_status', { sessionId, status: 'CONNECTED' });
          await createSessionLog(sessionId, 'INFO', `Session connected — ${name || 'unknown'}`);
        }

        if (connection === 'close') {
          // If session already removed (e.g. by deleteSession), skip
          if (!this.sessions.has(sessionId)) return;

          const err = lastDisconnect?.error as Boom | undefined;
          const statusCode = err?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const reasonText = statusCode ? (DisconnectReason[statusCode] || `code_${statusCode}`) : 'unknown';
          
          // Detailed disconnect logging
          logger.warn({
            sessionId,
            statusCode,
            reason: reasonText,
            isLoggedOut,
            errorMessage: err?.message,
            errorStack: err?.stack,
            errorOutput: err?.output,
            lastDisconnect: lastDisconnect ? {
              error: lastDisconnect.error,
              date: lastDisconnect.date
            } : undefined
          }, 'connection.update: close — DETAILED');
          
          await createSessionLog(sessionId, 'WARN', `Disconnected: ${reasonText} (${statusCode ?? 'unknown'})`);

          if (isLoggedOut) {
            await this.updateStatus(sessionId, 'disconnected');
            await authStore.clear();
            this.sessions.delete(sessionId);
            this.qrCodes.delete(sessionId);
            this.pairingCodes.delete(sessionId);
            serverIO?.emit('sessionDisconnected', { sessionId, loggedOut: true });
            serverIO?.emit('connection_status', { sessionId, status: 'DISCONNECTED' });
            baileysSession.connectingGuard = false;
            return;
          }

          // Update status for reconnect
          await this.updateStatus(sessionId, 'connecting');
          serverIO?.emit('sessionDisconnected', { sessionId, loggedOut: false });
          serverIO?.emit('connection_status', { sessionId, status: 'RECONNECTING' });

          // Always reconnect unless logged out
          // If session is already registered, don't request new pairing code
          const alreadyRegistered = authStore.isRegistered();
          baileysSession.connectingGuard = false;
          this.scheduleReconnect(sessionId, usePairingCode && !alreadyRegistered);
        }
      });

      // ─── Credentials Update ──────────────────────────────────────────────
      socket.ev.on('creds.update', async () => {
        const reg = authStore.isRegistered();
        logger.info({ sessionId, registered: reg }, 'creds.update — saving credentials');
        await authStore.saveCreds();
        if (reg) {
          logger.info({ sessionId }, 'Session is now registered (paired)');
        }
      });

      // ─── Incoming Messages ────────────────────────────────────────────────
      socket.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify' || m.type === 'append') {
          for (const msg of m.messages) {
            if (msg.message) {
              await createSessionLog(sessionId, 'DEBUG', `Message: ${msg.key.id}`);
            }
          }
        }
      });

      // ─── Delivery Status Updates ───────────────────────────────────────────
      // sendMessage resolves when queued locally, NOT when delivered.
      // WhatsApp sends status updates (incl. errors) through this event.
      socket.ev.on('messages.update', async (updates) => {
        for (const u of updates) {
          const status = u.status;
          const msgId = u.key?.id;
          if (!msgId) continue;

          if (status === 'error') {
            const errorCode = (u as any).messageStubType || (u as any).messageStubParameters?.[0] || 'unknown';
            const errMsg = `Delivery failed for ${msgId}: error ${errorCode}`;
            logger.error({ sessionId, msgId, errorCode, update: u }, errMsg);
            await createSessionLog(sessionId, 'ERROR', errMsg);
            serverIO?.emit('messageDeliveryFailed', { sessionId, msgId, error: errorCode });
          } else if (status >= 2) {
            // status 2 = delivered, 3 = read — useful telemetry
            logger.debug({ sessionId, msgId, status }, `Message ${msgId} status update: ${status}`);
          }
        }
      });

    } catch (err) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.connectingGuard = false;
      }
      throw err;
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    this.cancelReconnect(sessionId);

    const baileysSession = this.sessions.get(sessionId);
    if (baileysSession?.socket) {
      try {
        await baileysSession.socket.logout();
      } catch {
        // ignore
      }
    }

    this.sessions.delete(sessionId);
    this.qrCodes.delete(sessionId);
    this.pairingCodes.delete(sessionId);

    await this.updateStatus(sessionId, 'disconnected');
    serverIO?.emit('sessionDisconnected', { sessionId, manual: true });
    await createSessionLog(sessionId, 'INFO', 'Session disconnected manually');
  }

  async restart(sessionId: string): Promise<void> {
    await createSessionLog(sessionId, 'INFO', 'Session restart requested');
    this.cancelReconnect(sessionId);

    const baileysSession = this.sessions.get(sessionId);
    if (baileysSession?.socket) {
      try {
        baileysSession.socket.end(undefined);
      } catch {
        // ignore
      }
    }

    this.sessions.delete(sessionId);
    await this.updateStatus(sessionId, 'disconnected');
    await new Promise((r) => setTimeout(r, 1500));
    await this.connect(sessionId);
  }

  // ─── Messaging ────────────────────────────────────────────────────────────

  async sendTextMessage(sessionId: string, to: string, text: string): Promise<string> {
    const baileysSession = this.sessions.get(sessionId);
    if (!baileysSession) throw new Error(`Session ${sessionId} not connected`);

    const jid = this.normalizeJid(to);

    return baileysSession.messageQueue.add(async () => {
      const result = await baileysSession.socket.sendMessage(jid, { text });
      await this.touchActivity(sessionId);
      await this.logMessage(sessionId, to, 'text', text);
      return result?.key.id ?? '';
    });
  }

  async sendMediaMessage(
    sessionId: string,
    to: string,
    media: { image?: Buffer; video?: Buffer; document?: Buffer; audio?: Buffer; sticker?: Buffer },
    mimetype: string,
    filename?: string,
    caption?: string
  ): Promise<string> {
    const baileysSession = this.sessions.get(sessionId);
    if (!baileysSession) throw new Error(`Session ${sessionId} not connected`);

    const jid = this.normalizeJid(to);

    return baileysSession.messageQueue.add(async () => {
      const message: any = { mimetype, caption };
      if (media.image) message.image = media.image;
      else if (media.video) message.video = media.video;
      else if (media.document) { message.document = media.document; message.fileName = filename; }
      else if (media.audio) message.audio = media.audio;
      else if (media.sticker) message.sticker = media.sticker;

      const result = await baileysSession.socket.sendMessage(jid, message);
      await this.touchActivity(sessionId);
      await this.logMessage(sessionId, to, 'media', filename ?? 'media');
      return result?.key.id ?? '';
    });
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getAllSessions(): Promise<SessionInfo[]> {
    const rows = await prisma.session.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((r) => {
      const info = this.toSessionInfo(r);
      if (this.qrCodes.has(r.id)) info.qrCode = this.qrCodes.get(r.id);
      if (this.pairingCodes.has(r.id)) info.pairingCode = this.pairingCodes.get(r.id);
      return info;
    });
  }

  getQRCode(sessionId: string): string | undefined {
    return this.qrCodes.get(sessionId);
  }

  getPairingCode(sessionId: string): string | undefined {
    return this.pairingCodes.get(sessionId);
  }

  isConnected(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private normalizeJid(to: string): string {
    const digits = to.replace(/\D/g, '');
    return digits.includes('@') ? to : `${digits}@s.whatsapp.net`;
  }

  private async updateStatus(sessionId: string, status: SessionInfo['status']): Promise<void> {
    await prisma.session.update({ where: { id: sessionId }, data: { status } }).catch(() => {});
  }

  private async touchActivity(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    }).catch(() => {});
  }

  private async logMessage(sessionId: string, to: string, type: string, preview: string): Promise<void> {
    await prisma.message.create({
      data: { sessionId, to, type, content: preview, status: 'sent', sentAt: new Date() },
    }).catch(() => {});

    serverIO?.emit('messageSent', { sessionId, to, type, preview, sentAt: new Date() });
  }

  private toSessionInfo(row: {
    id: string;
    name: string;
    phoneNumber: string;
    status: string;
    profileName?: string | null;
    avatarUrl?: string | null;
    connectedAt?: Date | null;
    lastActivity?: Date | null;
  }): SessionInfo {
    return {
      id: row.id,
      name: row.name,
      phoneNumber: row.phoneNumber,
      status: row.status as SessionInfo['status'],
      profileName: row.profileName,
      avatarUrl: row.avatarUrl,
      connectedAt: row.connectedAt,
      lastActivity: row.lastActivity,
    };
  }

  private scheduleReconnect(sessionId: string, usePairingCode: boolean): void {
    const baileysSession = this.sessions.get(sessionId);
    const attempts = (baileysSession?.reconnectAttempts ?? 0) + 1;

    if (baileysSession) {
      baileysSession.reconnectAttempts = attempts;
    }

    if (attempts > MAX_RECONNECT_ATTEMPTS) {
      logger.warn({ sessionId }, 'Max reconnect attempts reached');
      this.pairingCodes.delete(sessionId);
      this.qrCodes.delete(sessionId);
      return;
    }

    // Exponential backoff with jitter: 3s, 6s, 12s, 24s, 48s
    const baseDelay = RECONNECT_BASE_DELAY_MS * Math.pow(2, attempts - 1);
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;

    logger.info({ sessionId, delay: Math.round(delay), attempt: attempts }, 'Scheduling reconnect');

    const timer = setTimeout(() => {
      if (baileysSession) baileysSession.reconnectTimer = null;
      this.connect(sessionId, usePairingCode).catch((err) =>
        logger.error({ sessionId, err }, 'Reconnect failed')
      );
    }, delay);

    if (baileysSession) {
      baileysSession.reconnectTimer = timer;
    }
  }

  private cancelReconnect(sessionId: string): void {
    const baileysSession = this.sessions.get(sessionId);
    if (baileysSession?.reconnectTimer) {
      clearTimeout(baileysSession.reconnectTimer);
      baileysSession.reconnectTimer = null;
    }
  }
}

// Singleton
export const sessionManager = new SessionManager();
