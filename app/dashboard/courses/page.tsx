import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Edit, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function CoursesManagementPage() {
  await requireRole(['admin', 'super_admin'])
  const supabase = await createClient()
  const profile = await requireRole(['admin', 'super_admin'])

  // Get all courses (for super admin) or instructor's courses
  const query = supabase
    .from('courses')
    .select('*, instructor:profiles!courses_instructor_id_fkey(name), lessons(count)')
    .order('created_at', { ascending: false })

  if (profile.role === 'admin') {
    query.eq('instructor_id', profile.id)
  }

  const { data: courses } = await query

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Course Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your courses and lessons
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Course</span>
        </Link>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                  {course.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    course.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {course.description || 'No description'}
              </p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <BookOpen className="h-4 w-4 mr-2" />
                <span>{(course.lessons as any)?.[0]?.count || 0} lessons</span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span>Manage</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No courses found.
          </p>
          <Link
            href="/dashboard/courses/new"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Create your first course
          </Link>
        </div>
      )}
    </div>
  )
}

