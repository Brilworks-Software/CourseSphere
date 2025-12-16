import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { BookOpen, User } from 'lucide-react'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  // Get all active courses
  const { data: courses } = await supabase
    .from('courses')
    .select('*, instructor:profiles!courses_instructor_id_fkey(name, id), lessons(count)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Get user's enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', profile.id)

  const enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id) || [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Available Courses
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse and enroll in courses
          </p>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => {
              const isEnrolled = enrolledCourseIds.has(course.id)
              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {course.description || 'No description available'}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <User className="h-4 w-4 mr-2" />
                      <span>{course.instructor?.name || 'Unknown Instructor'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>{(course.lessons as any)?.[0]?.count || 0} lessons</span>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className={`block w-full text-center py-2 px-4 rounded-md transition-colors ${
                        isEnrolled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isEnrolled ? 'Continue Learning' : 'View Course'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No courses available at the moment.
            </p>
          </div>
        )}
      </div>
  )
}

