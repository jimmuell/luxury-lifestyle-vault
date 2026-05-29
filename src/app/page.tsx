import { redirect } from 'next/navigation'

// Middleware handles auth routing; this is a fallback for direct root access
export default function RootPage() {
  redirect('/auth/login')
}
