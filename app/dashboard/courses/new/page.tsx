import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CreateCourseForm } from '@/components/create-course-form'

export default async function NewCoursePage() {
  await requireRole(['admin', 'super_admin'])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Create New Course
      </h1>
      <CreateCourseForm />
    </div>
  )
}

