import pg from 'pg'
const { Pool } = pg

const connectionString = process.env.DATABASE_URL

let poolInstance: pg.Pool | null = null

function getPool() {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString,
      // Supabase requires SSL by default
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
      // Connection pool settings optimized for Supabase
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  
  return poolInstance
}

export { getPool }
export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return getPool()[prop as keyof pg.Pool]
  }
})

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const dbPool = getPool()
  const client = await dbPool.connect()
  try {
    const res = await client.query(text, params)
    return { rows: res.rows as T[] }
  } finally {
    client.release()
  }
}

