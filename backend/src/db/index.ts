import pg from 'pg'
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

export const pool = new Pool({
  connectionString,
  // Supabase requires SSL by default
  // SSL is enabled by default for Supabase connections
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  // Connection pool settings optimized for Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return { rows: res.rows as T[] }
  } finally {
    client.release()
  }
}


