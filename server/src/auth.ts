import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import prisma from './prisma.js'
import { hashPassword, verifyPassword } from './password.js'

// In-memory session store (sufficient for single-process; swap for Redis in production)
const sessions = new Map<string, { createdAt: number }>()
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours
const COOKIE_NAME = 'cm_session'

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function isExpired(createdAt: number): boolean {
  return Date.now() - createdAt > SESSION_TTL_MS
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME]

  if (!token || !sessions.has(token) || isExpired(sessions.get(token)!.createdAt)) {
    if (token) sessions.delete(token)
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  next()
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const { password } = req.body as { password?: string }

  if (!password) {
    res.status(400).json({ success: false, error: 'Password required' })
    return
  }

  // Look up stored hash
  const setting = await prisma.setting.findUnique({ where: { key: 'dashboardPasswordHash' } })

  // If no password has been configured yet, accept the plain DASHBOARD_PASSWORD env var
  // and hash + store it automatically on first login
  if (!setting) {
    const envPassword = process.env.DASHBOARD_PASSWORD
    if (!envPassword) {
      res.status(500).json({ success: false, error: 'Dashboard password not configured' })
      return
    }

    if (password !== envPassword) {
      res.status(401).json({ success: false, error: 'Invalid password' })
      return
    }

    // Hash and persist for future logins
    const hash = await hashPassword(envPassword)
    await prisma.setting.create({ data: { key: 'dashboardPasswordHash', value: hash } })
  } else {
    const valid = await verifyPassword(password, setting.value)
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid password' })
      return
    }
  }

  const token = generateToken()
  sessions.set(token, { createdAt: Date.now() })

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    secure: process.env.NODE_ENV === 'production',
  })

  res.json({ success: true, data: { message: 'Authenticated' } })
}

export function logout(req: Request, res: Response): void {
  const token = req.cookies?.[COOKIE_NAME]
  if (token) sessions.delete(token)
  res.clearCookie(COOKIE_NAME)
  res.json({ success: true, data: { message: 'Logged out' } })
}

export function checkAuth(req: Request, res: Response): void {
  const token = req.cookies?.[COOKIE_NAME]

  if (!token || !sessions.has(token) || isExpired(sessions.get(token)!.createdAt)) {
    if (token) sessions.delete(token)
    res.json({ success: true, data: { authenticated: false } })
    return
  }

  res.json({ success: true, data: { authenticated: true } })
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string
    newPassword?: string
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' })
    return
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })
    return
  }

  const setting = await prisma.setting.findUnique({ where: { key: 'dashboardPasswordHash' } })

  if (setting) {
    const valid = await verifyPassword(currentPassword, setting.value)
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' })
      return
    }
  } else {
    // Still first run — accept env password
    if (currentPassword !== process.env.DASHBOARD_PASSWORD) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' })
      return
    }
  }

  const hash = await hashPassword(newPassword)
  await prisma.setting.upsert({
    where:  { key: 'dashboardPasswordHash' },
    update: { value: hash },
    create: { key: 'dashboardPasswordHash', value: hash },
  })

  res.json({ success: true, data: { message: 'Password updated' } })
}
