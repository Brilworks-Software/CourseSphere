import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from './types'

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const user = await getUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it (fallback if trigger didn't run)
  if (error || !profile) {
    // Try to get user metadata
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const metadata = authUser?.user_metadata || {}
    
    // Create profile with default values
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: metadata.name || null,
        role: (metadata.role as any) || 'student',
        theme: 'system',
      })
      .select()
      .single()

    if (createError || !newProfile) {
      redirect('/login')
    }

    return newProfile
  }

  return profile
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getProfile()

  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  return profile
}

