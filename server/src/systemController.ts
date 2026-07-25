import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from './prisma.js';
import { version as nodeVersion } from 'process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: { status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' },
    });
  } catch {
    res.status(503).json({ success: false, error: 'Service unavailable' });
  }
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalSessions,
      activeSessions,
      disconnectedSessions,
      pausedSessions,
      messagesSentToday,
      totalMessages,
      totalLogs,
    ] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { status: 'connected' } }),
      prisma.session.count({ where: { status: 'disconnected' } }),
      prisma.session.count({ where: { status: 'paused' } }),
      prisma.message.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.message.count(),
      prisma.sessionLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        disconnectedSessions,
        pausedSessions,
        messagesSentToday,
        messagesReceived: totalMessages,
        totalLogs,
        serverStatus: 'Operational',
        nodeVersion: nodeVersion,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getLogs(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const level = req.query.level as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = {};
    if (level) where.level = level.toUpperCase();
    if (sessionId) where.sessionId = sessionId;
    if (search) where.message = { contains: search };

    const [logs, total] = await Promise.all([
      prisma.sessionLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sessionLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getMessageHistory(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const sessionId = req.query.sessionId as string | undefined;

    const where: Record<string, unknown> = {};
    if (sessionId) where.sessionId = sessionId;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { session: { select: { name: true } } },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

// Auth endpoints
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    // Find or auto-provision admin user from DASHBOARD_PASSWORD env
    let user = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!user) {
      const envPassword = process.env.DASHBOARD_PASSWORD;
      if (!envPassword) {
        res.status(500).json({ success: false, error: 'No admin user configured' });
        return;
      }
      const hashed = await bcrypt.hash(envPassword, 12);
      user = await prisma.user.create({
        data: { email: 'admin@dashboard.local', password: hashed, name: 'Admin', role: 'admin' },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Client-side token removal is sufficient for JWT
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function checkAuth(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { authenticated: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current and new password required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getApiRequests(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);

    const [requests, total] = await Promise.all([
      prisma.apiRequestLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.apiRequestLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getRateLimits(_req: Request, res: Response): Promise<void> {
  try {
    const oneMinAgo = new Date(Date.now() - 60_000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [requestsLastMin, messagesToday, mediaToday] = await Promise.all([
      prisma.apiRequestLog.count({ where: { createdAt: { gte: oneMinAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.message.count({ where: { createdAt: { gte: todayStart }, type: { in: ['image', 'document'] } } }),
    ]);

    res.json({
      success: true,
      data: {
        requestsPerMin: { used: requestsLastMin, cap: 500 },
        messagesPerHour: { used: messagesToday, cap: 10000 },
        mediaUploadsPerDay: { used: mediaToday, cap: 500 },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getApiKeys(_req: Request, res: Response): Promise<void> {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      include: { session: { select: { id: true, name: true, phoneNumber: true } } },
    });
    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function createApiKey(req: Request, res: Response): Promise<void> {
  try {
    const { name, sessionId } = req.body as { name?: string; sessionId?: string };
    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }
    const crypto = await import('crypto');
    const key = 'cm_' + crypto.randomBytes(24).toString('hex');
    const apiKey = await prisma.apiKey.create({
      data: { name, key, sessionId: sessionId || null },
      include: { session: { select: { id: true, name: true, phoneNumber: true } } },
    });
    res.status(201).json({ success: true, data: apiKey });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function deleteApiKey(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.apiKey.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}


export async function getMessageTrends(_req: Request, res: Response): Promise<void> {
  try {
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const data: { day: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const count = await prisma.message.count({ where: { createdAt: { gte: d, lte: end } } });
      data.push({ day: dayNames[d.getDay()], count });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getDeliveryStats(_req: Request, res: Response): Promise<void> {
  try {
    const total = await prisma.message.count();
    const failed = await prisma.message.count({ where: { error: { not: null } } });
    const success = total - failed;
    res.json({ success: true, data: { success, failed, total, rate: total ? Math.round((success / total) * 100) : 100 } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}

export async function getApiUsage(_req: Request, res: Response): Promise<void> {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = await prisma.apiRequestLog.findMany({
      where: { createdAt: { gte: today } },
      select: { createdAt: true },
    });
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: String(i).padStart(2,'0'), calls: 0 }));
    for (const r of rows) {
      hours[new Date(r.createdAt).getHours()].calls++;
    }
    res.json({ success: true, data: hours });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
}


