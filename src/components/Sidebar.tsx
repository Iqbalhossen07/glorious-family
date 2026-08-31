'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Utensils, ShoppingCart, Settings, LogOut, Users, Wallet, FileText, ClipboardList, Activity, PieChart, Banknote, Key, Shield } from 'lucide-react'
import Logo from './Logo'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    AuthService.getCurrentUser().then(user => {
      if (user?.email === 'iqbalhossen0711@gmail.com') setIsSuperAdmin(true)
    })
  }, [])

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: <Home size={18} />, color: '#3b82f6' },
    { name: 'Members', path: '/dashboard/members', icon: <Users size={18} />, color: '#f43f5e' },
    { name: 'Room Rents', path: '/dashboard/room-rents', icon: <Key size={18} />, color: '#f59e0b' },
    { name: 'Bazar', path: '/dashboard/bazar', icon: <ShoppingCart size={18} />, color: '#10b981' },
    { name: 'Meals', path: '/dashboard/meals', icon: <Utensils size={18} />, color: '#f59e0b' },
    { name: 'Deposits', path: '/dashboard/deposits', icon: <Wallet size={18} />, color: '#0ea5e9' },
    { name: 'Others', path: '/dashboard/other-expenses', icon: <FileText size={18} />, color: '#8b5cf6' },
    { name: 'Info', path: '/dashboard/mess-info', icon: <ClipboardList size={18} />, color: '#ec4899' },
    { name: 'Summary', path: '/dashboard/summary', icon: <PieChart size={18} />, color: '#14b8a6' },
    { name: 'Settlements', path: '/dashboard/settlements', icon: <Banknote size={18} />, color: '#8b5cf6' },
    { name: 'Activity Log', path: '/dashboard/activity-log', icon: <Activity size={18} />, color: '#f97316' },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={18} />, color: '#64748b' },
  ]

  if (isSuperAdmin) {
    navItems.push({ name: 'Super Admin', path: '/dashboard/super-admin', icon: <Shield size={18} />, color: '#ef4444' })
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
      router.push('/login')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <aside className="hide-on-mobile" style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(248, 250, 252, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      zIndex: 100,
      overflowY: 'auto'
    }}>
      
      <div style={{ marginBottom: '2rem', paddingLeft: '0.5rem' }}>
        <Logo size="sm" />
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {navItems.map((item) => {
          let isActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path)
          
          if (item.name === 'Settlements' && pathname.startsWith('/dashboard/invoice')) {
            isActive = true
          }

          return (
            <Link key={item.path} href={item.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--text-main)',
              background: isActive ? 'var(--primary)' : '#fff',
              boxShadow: isActive ? '0 4px 15px rgba(148, 163, 184, 0.4)' : '0 2px 8px rgba(148, 163, 184, 0.1)',
              border: isActive ? '1px solid transparent' : '1px solid rgba(0,0,0,0.02)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ color: isActive ? '#fff' : item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={20} />
        Logout
      </button>

    </aside>
  )
}
