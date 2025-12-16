import { Navbar } from '@/components/navbar'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const profile = await getProfile()
    if (!profile) {
      redirect('/login')
    }
  } catch {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      {children}
    </div>
  )
}

