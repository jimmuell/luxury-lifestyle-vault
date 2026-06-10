'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email to confirm your account.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function signInAsDemo(role: 'client' | 'admin' | 'investor') {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'true') {
    return { error: 'Demo login is not enabled in this environment.' }
  }

  const supabase = await createClient()
  const EMAIL_MAP = {
    admin: 'demo.admin@llv.dev',
    client: 'demo.client@llv.dev',
    investor: 'demo.investor@llv.dev',
  }
  const email = EMAIL_MAP[role]

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: 'demo1234',
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true as const }
}

export async function sendMagicLink(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: formData.get('email') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Magic link sent — check your inbox.' }
}
