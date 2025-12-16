import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, Plus, Edit, Trash2, Video } from 'lucide-react'
import Link from 'next/link'
import { ManageCourseForm } from '@/components/manage-course-form'
import { AddLessonForm } from '@/components/add-lesson-form'

export default async function CourseManagementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireRole(['admin', 'super_admin'])
  const supabase = await createClient()
  const profile = await requireRole(['admin', 'super_admin'])

  // Get course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) {
    redirect('/dashboard/courses')
  }

  // Check if user has access (admin can only edit their own courses)
  if (profile.role === 'admin' && course.instructor_id !== profile.id) {
    redirect('/dashboard/courses')
  }

  // Get lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/courses"
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 mb-4 inline-block"
        >
          ← Back to courses
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Manage Course
        </h1>
      </div>

      {/* Course Details Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Course Details
        </h2>
        <ManageCourseForm course={course} />
      </div>

      {/* Lessons Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lessons
          </h2>
          <AddLessonForm courseId={id} />
        </div>

        {lessons && lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {lesson.title}
                    </h3>
                    {lesson.duration && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Duration: {Math.floor(lesson.duration / 60)}:
                        {String(lesson.duration % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
                <DeleteLessonButton lessonId={lesson.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No lessons yet. Add your first lesson to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  return (
    <form action={deleteLessonAction}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        title="Delete lesson"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </form>
  )
}

async function deleteLessonAction(formData: FormData) {
  'use server'
  const lessonId = formData.get('lessonId') as string
  const supabase = await createClient()
  await requireRole(['admin', 'super_admin'])

  await supabase.from('lessons').delete().eq('id', lessonId)
}

