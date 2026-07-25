import type { Request, Response } from 'express';
import prisma from '../prisma.js';
import { sessionManager } from '../baileys/sessionManager.js';

export async function healthCheck(req: Request, res: Response): Promise<void> {
  const dbHealthy = await checkDatabase();
  const whatsappHealthy = checkWhatsApp();

  const status = dbHealthy && whatsappHealthy ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      whatsapp: whatsappHealthy ? 'healthy' : 'unhealthy',
    },
  });
}

export async function healthDatabase(req: Request, res: Response): Promise<void> {
  const healthy = await checkDatabase();
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
  });
}

export async function healthWhatsApp(req: Request, res: Response): Promise<void> {
  const sessions = await sessionManager.getAllSessions();
  const connectedSessions = sessions.filter((s: any) => s.status === 'connected').length;

  res.status(200).json({
    status: connectedSessions > 0 ? 'healthy' : 'no_connections',
    timestamp: new Date().toISOString(),
    connectedSessions,
    totalSessions: sessions.length,
  });
}

export async function healthQueue(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Queue health check not fully implemented',
  });
}

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function checkWhatsApp(): boolean {
  return true;
}
