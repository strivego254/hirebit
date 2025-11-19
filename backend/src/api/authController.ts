import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query } from '../db/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const SALT_ROUNDS = 10

export async function signup(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const { rows: existing } = await query<{ user_id: string }>(
      `select user_id from users where email = $1`,
      [email.toLowerCase()]
    )
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Account already exists' })
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const { rows } = await query<{ user_id: string }>(
      `insert into users (email, password_hash, role, is_active) values ($1, $2, 'user', true) returning user_id`,
      [email.toLowerCase(), hash]
    )
    const userId = rows[0].user_id
    const token = jwt.sign({ sub: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({ 
      token, 
      user: { 
        user_id: userId, 
        email: email.toLowerCase(),
        role: 'user'
      } 
    })
  } catch (err) {
    console.error('Signup error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    // Check if it's a database connection error
    if (errorMessage.includes('password') || errorMessage.includes('authentication') || errorMessage.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        error: 'Database connection failed. Please check DATABASE_URL in backend/.env',
        details: 'Make sure you replaced [YOUR_PASSWORD] with your actual Supabase database password'
      })
    }
    return res.status(500).json({ error: 'Failed to create account', details: errorMessage })
  }
}

export async function signin(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const { rows } = await query<{ user_id: string; password_hash: string; role: string; is_active: boolean }>(
      `select user_id, password_hash, role, is_active from users where email = $1`,
      [email.toLowerCase()]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!rows[0].is_active) {
      return res.status(401).json({ error: 'Account is inactive' })
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign({ sub: rows[0].user_id, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(200).json({ 
      token, 
      user: { 
        user_id: rows[0].user_id, 
        email: email.toLowerCase(),
        role: rows[0].role
      } 
    })
  } catch (err) {
    console.error('Signin error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    // Check if it's a database connection error
    if (errorMessage.includes('password') || errorMessage.includes('authentication') || errorMessage.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        error: 'Database connection failed. Please check DATABASE_URL in backend/.env',
        details: 'Make sure you replaced [YOUR_PASSWORD] with your actual Supabase database password'
      })
    }
    return res.status(500).json({ error: 'Failed to sign in', details: errorMessage })
  }
}


