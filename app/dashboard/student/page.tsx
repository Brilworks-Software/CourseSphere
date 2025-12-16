import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Play } from 'lucide-react'
import Link from 'next/link'

export default async function StudentDashboard() {
  await requireRole(['student'])
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:courses(*, instructor:profiles!courses_instructor_id_fkey(name), lessons(count))')
    .eq('student_id', user!.id)
    .order('created_at', { ascending: false })

  const enrolledCourses = enrollments?.map((e) => e.course).filter(Boolean) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Student Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Continue learning from your enrolled courses
        </p>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            My Enrolled Courses
          </h2>
          <Link
            href="/courses"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Browse all courses
          </Link>
        </div>
        <div className="p-6">
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
                      {course.title}
                    </h3>
                    <Play className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    by {course.instructor?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description || 'No description'}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{(course.lessons as any)?.[0]?.count || 0} lessons</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't enrolled in any courses yet.
              </p>
              <Link
                href="/courses"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Browse available courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

