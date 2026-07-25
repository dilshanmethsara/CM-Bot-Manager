import pino from 'pino';
import prisma from './prisma.js';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export async function createSessionLog(
  sessionId: string | null,
  level: string,
  message: string,
  metadata?: unknown,
): Promise<void> {
  try {
    // Use direct method calls instead of bracket notation
    switch (level.toLowerCase()) {
      case 'trace':
        logger.trace({ sessionId }, message);
        break;
      case 'debug':
        logger.debug({ sessionId }, message);
        break;
      case 'info':
        logger.info({ sessionId }, message);
        break;
      case 'warn':
        logger.warn({ sessionId }, message);
        break;
      case 'error':
        logger.error({ sessionId }, message);
        break;
      case 'fatal':
        logger.fatal({ sessionId }, message);
        break;
      default:
        logger.info({ sessionId }, message);
    }
    await prisma.sessionLog.create({
      data: {
        sessionId: sessionId ?? undefined,
        level: level.toUpperCase(),
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch {
    // swallow – logging must never crash the app
  }
}
