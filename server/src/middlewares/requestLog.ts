import type { Request, Response, NextFunction } from 'express';
import prisma from '../prisma.js';

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip logging health checks (too noisy)
  if (req.path === '/api/v1/system/health') {
    next();
    return;
  }

  const start = Date.now();

  // Override res.end to capture status
  const originalEnd = res.end.bind(res);
  res.end = function (...args: any[]) {
    const durationMs = Date.now() - start;

    // Log asynchronously, don't block response
    prisma.apiRequestLog.create({
      data: {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip || req.socket.remoteAddress || null,
      },
    }).catch(() => {}); // never fail the request due to logging

    return originalEnd(...args);
  };

  next();
}
