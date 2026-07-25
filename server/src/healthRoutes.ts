import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from './prisma.js';
import { sessionManager } from './baileys/sessionManager.js';

const router = Router();

// Public health endpoint
router.get('/', async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabase();
  const whatsappSessions = sessionManager.getAllSessions ? await sessionManager.getAllSessions() : [];
  const whatsappConnected = whatsappSessions.filter((s: { status: string }) => s.status === 'connected').length;

  const status = dbHealthy ? 'healthy' : 'degraded';
  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    whatsapp: {
      totalSessions: whatsappSessions.length,
      connected: whatsappConnected,
    },
  });
});

// Database health
router.get('/database', async (req: Request, res: Response) => {
  const healthy = await checkDatabase();
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
  });
});

// WhatsApp connections health
router.get('/whatsapp', async (req: Request, res: Response) => {
  const sessions = await sessionManager.getAllSessions();
  const connected = sessions.filter((s: { status: string }) => s.status === 'connected').length;

  res.json({
    status: connected > 0 ? 'healthy' : 'no_connections',
    timestamp: new Date().toISOString(),
    sessions: sessions.map((s: { id: string; name: string; phoneNumber: string; status: string; connectedAt?: Date | null }) => ({
      id: s.id,
      name: s.name,
      phoneNumber: s.phoneNumber,
      status: s.status,
      connectedAt: s.connectedAt,
    })),
  });
});

// Message queue health
router.get('/queue', (req: Request, res: Response) => {
  // TODO: Add message queue health when implemented
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    queue: { pending: 0, processing: 0 },
  });
});

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default router;
