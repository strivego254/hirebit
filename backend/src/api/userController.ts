import type { Request, Response } from 'express'
import { query } from '../db/index.js'
import type { AuthRequest } from '../middleware/auth.js'

// Get current user profile
export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { rows } = await query<{
      user_id: string
      email: string
      role: string
      is_active: boolean
      created_at: string
      updated_at: string | null
    }>(
      `SELECT user_id, email, role, is_active, created_at, updated_at 
       FROM users 
       WHERE user_id = $1`,
      [userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = rows[0]
    return res.json({
      id: user.user_id,
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    })
  } catch (err) {
    console.error('Error getting user profile:', err)
    return res.status(500).json({ error: 'Failed to get user profile' })
  }
}

