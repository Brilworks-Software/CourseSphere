import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Play, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { VideoPlayer } from '@/components/video-player'

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lesson?: string }>
}) {
  const { id } = await params
  const { lesson: lessonId } = await searchParams
  const supabase = await createClient()
  const profile = await getProfile()

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('*, instructor:profiles!courses_instructor_id_fkey(name, id)')
    .eq('id', id)
    .single()

  if (!course || !course.is_active) {
    redirect('/courses')
  }

  // Get lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', id)
    .order('created_at', { ascending: true })

  // Check if enrolled
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', profile.id)
    .eq('course_id', id)
    .single()

  const isEnrolled = !!enrollment

  // Get current lesson
  const currentLesson = lessonId
    ? lessons?.find((l) => l.id === lessonId)
    : lessons?.[0]

  // If student and not enrolled, show enrollment option
  if (profile.role === 'student' && !isEnrolled) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {course.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {course.description || 'No description available'}
            </p>
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Instructor: {course.instructor?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lessons: {lessons?.length || 0}
              </p>
            </div>
            <EnrollButton courseId={id} />
          </div>
        </div>
    )
  }

  // Show course content
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/courses"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 mb-4 inline-block"
          >
            ← Back to courses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {course.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {course.description || 'No description available'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Lessons
              </h2>
              <div className="space-y-2">
                {lessons && lessons.length > 0 ? (
                  lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${id}?lesson=${lesson.id}`}
                      className={`block p-3 rounded-md transition-colors ${
                        currentLesson?.id === lesson.id
                          ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-500 dark:border-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start">
                        <Play className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {index + 1}. {lesson.title}
                          </p>
                          {lesson.duration && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {Math.floor(lesson.duration / 60)}:
                              {String(lesson.duration % 60).padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No lessons available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {currentLesson && lessons ? (
                <VideoPlayer
                  lesson={currentLesson}
                  lessons={lessons}
                  courseId={id}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No lessons available for this course
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}

function EnrollButton({ courseId }: { courseId: string }) {
  return (
    <form action={enrollAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        Enroll in Course
      </button>
    </form>
  )
}

async function enrollAction(formData: FormData) {
  'use server'
  const courseId = formData.get('courseId') as string
  const supabase = await createClient()
  const profile = await getProfile()

  await supabase.from('enrollments').insert({
    student_id: profile.id,
    course_id: courseId,
  })

  redirect(`/courses/${courseId}`)
}
