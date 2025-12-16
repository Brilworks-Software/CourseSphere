import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const profile = await requireRole(['admin', 'super_admin'])
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: body.title,
        description: body.description || null,
        instructor_id: profile.id,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

