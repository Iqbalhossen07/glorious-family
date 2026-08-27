'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/auth.service'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await AuthService.getSession()
        if (session) {
          setIsAuthenticated(true)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading your family space...
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
