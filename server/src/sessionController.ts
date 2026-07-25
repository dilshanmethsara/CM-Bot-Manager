import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sessionManager } from './baileys/sessionManager.js';

export async function getAllSessions(req: Request, res: Response): Promise<void> {
  try {
    const sessions = await sessionManager.getAllSessions();
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function createSession(req: Request, res: Response): Promise<void> {
  try {
    const { name, phoneNumber } = req.body as { name?: string; phoneNumber?: string };

    if (!name || !phoneNumber) {
      res.status(400).json({ success: false, error: 'name and phoneNumber are required' });
      return;
    }

    const id = uuidv4();
    const session = await sessionManager.createSession(id, name, phoneNumber);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  try {
    await sessionManager.deleteSession(req.params.id as string);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    const msg = String(err);
    res.status(msg.includes('not found') ? 404 : 500).json({ success: false, error: msg });
  }
}

export async function connectSession(req: Request, res: Response): Promise<void> {
  try {
    const usePairing = req.body?.method === 'pairing';
    await sessionManager.connect(req.params.id as string, usePairing);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function disconnectSession(req: Request, res: Response): Promise<void> {
  try {
    await sessionManager.disconnect(req.params.id as string);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function restartSession(req: Request, res: Response): Promise<void> {
  try {
    await sessionManager.restart(req.params.id as string);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getSessionQR(req: Request, res: Response): Promise<void> {
  try {
    const qrCode = sessionManager.getQRCode(req.params.id as string);
    if (!qrCode) {
      res.status(404).json({ success: false, error: 'No QR code available for this session' });
      return;
    }
    res.json({ success: true, data: { qrCode } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getSessionPairingCode(req: Request, res: Response): Promise<void> {
  try {
    const pairingCode = sessionManager.getPairingCode(req.params.id as string);
    if (!pairingCode) {
      res.status(404).json({ success: false, error: 'No pairing code available for this session' });
      return;
    }
    res.json({ success: true, data: { pairingCode } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function updateSession(req: Request, res: Response): Promise<void> {
  try {
    const { name, phoneNumber } = req.body as { name?: string; phoneNumber?: string };
    const sessionId = req.params.id as string;

    const session = await sessionManager.getAllSessions().then(s => s.find(x => x.id === sessionId));
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    // For now, just return the session (actual update would require DB update)
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getSessionStatus(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.params.id as string;
    const session = await sessionManager.getAllSessions().then(s => s.find(x => x.id === sessionId));
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    const connected = sessionManager.isConnected(sessionId);
    res.json({
      success: true,
      data: {
        id: sessionId,
        name: session.name,
        phoneNumber: session.phoneNumber,
        status: session.status,
        connected,
        profileName: session.profileName,
        lastActivity: session.lastActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
