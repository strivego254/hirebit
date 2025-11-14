import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/schemas/contact'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: 'Supabase admin client not configured.' },
        { status: 500 }
      )
    }

    const data = await request.json()
    const parsed = contactSchema.safeParse(data)

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: 'Invalid contact submission.',
          errors: parsed.error.flatten(),
        },
        { status: 422 }
      )
    }

    const { fullName, email, company, role, topic, message } = parsed.data

    const { error } = await supabaseAdmin
      .from('contact_requests')
      .insert({
        full_name: fullName,
        email,
        company,
        role,
        topic,
        message,
      })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { message: 'Failed to store contact request.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Contact request received.' }, { status: 201 })
  } catch (error) {
    console.error('Contact submission error:', error)
    return NextResponse.json({ message: 'Unexpected server error.' }, { status: 500 })
  }
}

