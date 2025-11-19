import { POST } from '@/app/api/contact/route'
import { contactSchema } from '@/lib/schemas/contact'

jest.mock('@/lib/db', () => {
  return {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  }
})

const { query } = require('@/lib/db')

describe('contactSchema', () => {
  it('accepts valid payload', () => {
    const payload = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
      role: 'Head of Talent',
      topic: 'Enterprise onboarding',
      message: 'We would love to learn more about your AI hiring tools.',
    }

    const result = contactSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('rejects invalid payload', () => {
    const payload = {
      fullName: 'J',
      email: 'invalid-email',
      company: 'A',
      role: 'H',
      topic: 'AI',
      message: 'Too short',
    }

    const result = contactSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})

describe('POST /api/contact', () => {
  beforeEach(() => {
    query.mockClear()
  })

  it('persists valid submission', async () => {
    const payload = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
      role: 'Head of Talent',
      topic: 'Enterprise onboarding',
      message: 'We would love to learn more about your AI hiring tools.',
    }

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body).toEqual({ message: 'Contact request received.' })
    expect(query).toHaveBeenCalledTimes(1)
    const [sql, params] = query.mock.calls[0]
    expect(sql).toMatch(/insert into contact_requests/i)
    expect(params).toEqual([
      payload.fullName,
      payload.email,
      payload.company,
      payload.role,
      payload.topic,
      payload.message,
    ])
  })

  it('returns validation error for invalid submission', async () => {
    const payload = {
      fullName: 'J',
      email: 'invalid',
      company: 'A',
      role: 'H',
      topic: 'AI',
      message: 'short',
    }

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    expect(response.status).toBe(422)
  })
})

