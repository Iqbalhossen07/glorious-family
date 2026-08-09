'use client'
import { useEffect, useState } from 'react'
import Logo from './Logo'
import { AuthService } from '@/services/auth.service'

export default function MobileTopBar() {
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await AuthService.getSession()
        const fullName = session?.user?.user_metadata?.full_name
        if (fullName) {
          setInitials(fullName.charAt(0).toUpperCase())
        }
      } catch (error) {}
    }
    fetchUser()
  }, [])

  return (
    <header className="hide-on-desktop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 1.25rem',
      zIndex: 100,
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    }}>
      <Logo size="sm" />
      
      <div style={{
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1rem',
        boxShadow: '0 2px 8px rgba(12, 173, 121, 0.3)'
      }}>
        {initials}
      </div>
    </header>
  )
}
