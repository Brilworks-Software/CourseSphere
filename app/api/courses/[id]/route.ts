import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await requireRole(['admin', 'super_admin'])
    const supabase = await createClient()

    // Check if user has access
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (profile.role === 'admin' && course.instructor_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('courses')
      .update({
        title: body.title,
        description: body.description || null,
        is_active: body.is_active !== undefined ? body.is_active : course.is_active,
      })
      .eq('id', id)
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

