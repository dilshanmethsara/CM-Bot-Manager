import { AuthenticationState, AuthenticationCreds, SignalDataTypeMap, initAuthCreds } from '@whiskeysockets/baileys';
import prisma from '../prisma.js';
import { encryptJson, decryptJson, EncryptedData } from './encryption.js';
import { logger } from '../logger.js';

export interface StoredAuth {
  creds: AuthenticationCreds;
  keys: {
    'pre-key'?: { [key: string]: any };
    session?: { [key: string]: any };
    'sender-key'?: { [key: string]: any };
    'sender-key-memory'?: { [key: string]: any };
    'app-state-sync-key'?: { [key: string]: any };
    'app-state-sync-version'?: { [key: string]: any };
    [key: string]: { [key: string]: any } | undefined;
  };
}

export class BaileysAuthStore {
  private sessionId: string;
  private cachedCreds: AuthenticationCreds | null = null;
  private cachedKeys: StoredAuth['keys'] = {};

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async load(): Promise<AuthenticationState> {
    const session = await prisma.session.findUnique({
      where: { id: this.sessionId },
      select: {
        credentialsEncrypted: true,
        keysEncrypted: true,
      },
    });

    if (session?.credentialsEncrypted && session?.keysEncrypted) {
      try {
        const credsData: EncryptedData = JSON.parse(session.credentialsEncrypted);
        const keysData: EncryptedData = JSON.parse(session.keysEncrypted);

        this.cachedCreds = decryptJson<AuthenticationCreds>(credsData);
        this.cachedKeys = decryptJson<StoredAuth['keys']>(keysData);

        logger.info({ sessionId: this.sessionId }, 'Loaded auth state from database');
      } catch (error) {
        logger.error({ sessionId: this.sessionId, error }, 'Failed to decrypt auth state, starting fresh');
        this.cachedCreds = null;
        this.cachedKeys = {};
      }
    }

    return this.getAuthState();
  }

  async saveCreds(): Promise<void> {
    if (!this.cachedCreds) return;

    try {
      const credsEncrypted = encryptJson(this.cachedCreds);
      const keysEncrypted = encryptJson(this.cachedKeys);

      await prisma.session.update({
        where: { id: this.sessionId },
        data: {
          credentialsEncrypted: JSON.stringify(credsEncrypted),
          keysEncrypted: JSON.stringify(keysEncrypted),
        },
      });

      logger.debug({ sessionId: this.sessionId }, 'Saved auth credentials to database');
    } catch (error) {
      logger.error({ sessionId: this.sessionId, error }, 'Failed to save auth credentials');
      throw error;
    }
  }

  getAuthState(): AuthenticationState {
    if (!this.cachedCreds) {
      this.cachedCreds = initAuthCreds();
      this.cachedKeys = {};
    }

    return {
      creds: this.cachedCreds,
      keys: {
        get: async (type, ids) => {
          const keyMap = this.cachedKeys[type];
          if (!keyMap) return {};
          const result: { [key: string]: any } = {};
          for (const id of ids) {
            if (keyMap[id]) {
              result[id] = keyMap[id];
            }
          }
          return result;
        },
        set: async (data) => {
          for (const [type, keyMap] of Object.entries(data)) {
            if (!this.cachedKeys[type]) {
              this.cachedKeys[type] = {};
            }
            Object.assign(this.cachedKeys[type]!, keyMap);
          }
        },
      },
    };
  }

  isRegistered(): boolean {
    return this.cachedCreds?.registered === true;
  }

  async clear(): Promise<void> {
    this.cachedCreds = null;
    this.cachedKeys = {};

    await prisma.session.update({
      where: { id: this.sessionId },
      data: {
        credentialsEncrypted: null,
        keysEncrypted: null,
      },
    }).catch(() => {
      // session already deleted
    });

    logger.info({ sessionId: this.sessionId }, 'Cleared auth state from database');
  }
}
