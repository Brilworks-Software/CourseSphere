import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const profile = await requireRole(['admin', 'super_admin'])
    const supabase = await createClient()
    const body = await request.json()

    // Verify course ownership
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', body.course_id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (profile.role === 'admin' && course.instructor_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: body.course_id,
        title: body.title,
        video_url: body.video_url,
        duration: body.duration || null,
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

