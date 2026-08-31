'use client'
import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Shield, LogOut, LayoutDashboard } from 'lucide-react'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      Swal.fire({
        icon: 'success',
        title: 'Logged out successfully',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
      router.push('/admin/login')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Admin Sidebar */}
      <aside className="hide-on-mobile" style={{
        width: '260px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'rgba(25, 25, 30, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        zIndex: 100,
        color: '#fff'
      }}>
        <div style={{ marginBottom: '2rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield color="#ef4444" size={28} />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>BDMess Admin</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Link href="/admin/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            textDecoration: 'none',
            color: '#fff',
            background: 'var(--primary)',
            boxShadow: '0 4px 15px rgba(12, 173, 121, 0.4)',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
        </nav>

        <button onClick={handleLogout} style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '0.75rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <LogOut size={20} />
          Admin Logout
        </button>
      </aside>

      {/* Admin Mobile Top Bar */}
      <header className="hide-on-desktop" style={{
        position: 'fixed',
        top: 0, left: 0, width: '100%',
        background: 'rgba(25, 25, 30, 0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.25rem',
        zIndex: 100,
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield color="#ef4444" size={24} />
          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Admin Portal</span>
        </div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
        }}>A</div>
      </header>

      {/* Admin Mobile Nav */}
      <nav className="hide-on-desktop" style={{
        position: 'fixed',
        bottom: 0, left: 0, width: '100%',
        background: 'rgba(25, 25, 30, 0.98)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.8rem 0.5rem',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0.5rem) + 0.2rem)',
        zIndex: 100,
      }}>
        <Link href="/admin/dashboard" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
          color: 'var(--primary)', textDecoration: 'none'
        }}>
          <LayoutDashboard size={20} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Dashboard</span>
        </Link>
        <button onClick={handleLogout} style={{
          background: 'none', border: 'none', color: '#ef4444',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem'
        }}>
          <LogOut size={20} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Logout</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
