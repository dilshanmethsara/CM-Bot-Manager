import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeinproduction';
const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  // 1. Try JWT
  const payload = verifyToken(token);
  if (payload) {
    req.user = payload;
    next();
    return;
  }

  // 2. Try API key (cm_ prefix)
  if (token.startsWith('cm_')) {
    try {
      const apiKey = await prisma.apiKey.findUnique({ where: { key: token } });
      if (apiKey) {
        // Update lastUsed timestamp (fire-and-forget)
        prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(() => {});
        req.user = { id: apiKey.id, email: 'api-key@cloudmint.com', role: 'apikey' };
        next();
        return;
      }
    } catch {
      res.status(500).json({ success: false, error: 'Authentication service unavailable' });
      return;
    }
  }

  res.status(401).json({ success: false, error: 'Invalid or expired token' });
}

export async function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    } else if (token.startsWith('cm_')) {
      const apiKey = await prisma.apiKey.findUnique({ where: { key: token } });
      if (apiKey) {
        req.user = { id: apiKey.id, email: 'api-key@cloudmint.com', role: 'apikey' };
      }
    }
  }
  next();
}
