import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  userRole?: string
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }

    // Verify user exists and is active
    const { rows } = await query<{ user_id: string; email: string; role: string; is_active: boolean }>(
      `SELECT user_id, email, role, is_active FROM users WHERE user_id = $1`,
      [decoded.sub]
    )

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }

    req.userId = rows[0].user_id
    req.userEmail = rows[0].email
    req.userRole = rows[0].role

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

