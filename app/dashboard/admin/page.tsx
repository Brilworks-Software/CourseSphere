import { requireRole, getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Video, Users } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const profile = await requireRole(['admin', 'super_admin'])
  const supabase = await createClient()

  // Get instructor's courses
  const { data: courses, count: coursesCount } = await supabase
    .from('courses')
    .select('*, lessons(count)', { count: 'exact' })
    .eq('instructor_id', profile.id)
    .order('created_at', { ascending: false })

  // Get total videos count
  const { count: videosCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .in(
      'course_id',
      courses?.map((c) => c.id) || []
    )

  // Get enrollments for instructor's courses
  const { count: enrollmentsCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .in(
      'course_id',
      courses?.map((c) => c.id) || []
    )

  const stats = [
    {
      name: 'My Courses',
      value: coursesCount || 0,
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      name: 'Total Videos',
      value: videosCount || 0,
      icon: Video,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      name: 'Total Enrollments',
      value: enrollmentsCount || 0,
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Instructor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage your courses and track engagement
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold"
        >
          Create Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center">
              <div className={`${stat.bgColor} p-4 rounded-xl border ${stat.borderColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.name}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Courses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            My Courses
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="p-6">
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="group block p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800"
                >
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {(course.lessons as any)?.[0]?.count || 0} lessons
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {course.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2 text-lg font-medium">
                No courses yet
              </p>
              <p className="text-gray-400 dark:text-gray-500 mb-6 text-sm">
                Get started by creating your first course
              </p>
              <Link
                href="/dashboard/courses/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold"
              >
                Create your first course
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

