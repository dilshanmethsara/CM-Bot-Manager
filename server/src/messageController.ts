import type { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { sessionManager } from './baileys/sessionManager.js';

// ─── Multer setup ─────────────────────────────────────────────────────────────

const UPLOADS_DIR = './uploads';
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB ceiling; individual handlers enforce lower
});

export const uploadImage = upload.single('image');
export const uploadDocument = upload.single('document');
export const uploadMedia = upload.single('media');

// ─── Text ─────────────────────────────────────────────────────────────────────

export async function sendTextMessage(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, to, content } = req.body as Record<string, string | undefined>;

    if (!sessionId || !to || !content) {
      res.status(400).json({ success: false, error: 'sessionId, to, and content are required' });
      return;
    }

    const messageId = await sessionManager.sendTextMessage(sessionId, to, content);
    res.json({ success: true, data: { messageId, sessionId, to, type: 'text', status: 'sent' } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

// ─── Image ────────────────────────────────────────────────────────────────────

export async function sendImageMessage(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, to, caption } = req.body as Record<string, string | undefined>;
    const file = req.file;

    if (!sessionId || !to || !file) {
      res.status(400).json({ success: false, error: 'sessionId, to, and image file are required' });
      return;
    }

    const buffer = fs.readFileSync(file.path);
    const messageId = await sessionManager.sendMediaMessage(
      sessionId,
      to,
      { image: buffer },
      file.mimetype,
      undefined,
      caption,
    );

    // Clean up temp file
    fs.unlink(file.path, () => {});

    res.json({ success: true, data: { messageId, sessionId, to, type: 'image', status: 'sent' } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

// ─── Document ─────────────────────────────────────────────────────────────────

export async function sendDocumentMessage(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, to, caption } = req.body as Record<string, string | undefined>;
    const file = req.file;

    if (!sessionId || !to || !file) {
      res.status(400).json({ success: false, error: 'sessionId, to, and document file are required' });
      return;
    }

    const buffer = fs.readFileSync(file.path);
    const messageId = await sessionManager.sendMediaMessage(
      sessionId,
      to,
      { document: buffer },
      file.mimetype,
      file.originalname,
      caption,
    );

    fs.unlink(file.path, () => {});

    res.json({ success: true, data: { messageId, sessionId, to, type: 'document', status: 'sent' } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

// ─── Media (generic) ─────────────────────────────────────────────────────────

export async function sendMediaMessage(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, to, mediaType, mimetype, filename, caption } = req.body as Record<string, string | undefined>;
    const file = req.file;

    if (!sessionId || !to || !file || !mediaType) {
      res.status(400).json({ success: false, error: 'sessionId, to, mediaType, and file are required' });
      return;
    }

    const buffer = fs.readFileSync(file.path);

    const media: { image?: Buffer; video?: Buffer; document?: Buffer; audio?: Buffer; sticker?: Buffer } = {};

    switch (mediaType) {
      case 'image':
        media.image = buffer;
        break;
      case 'video':
        media.video = buffer;
        break;
      case 'document':
        media.document = buffer;
        break;
      case 'audio':
        media.audio = buffer;
        break;
      case 'sticker':
        media.sticker = buffer;
        break;
      default:
        res.status(400).json({ success: false, error: `Unsupported media type: ${mediaType}` });
        return;
    }

    const messageId = await sessionManager.sendMediaMessage(
      sessionId,
      to,
      media,
      mimetype ?? file.mimetype,
      filename ?? file.originalname,
      caption,
    );

    fs.unlink(file.path, () => {});

    res.json({ success: true, data: { messageId, sessionId, to, type: mediaType, status: 'sent' } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}
