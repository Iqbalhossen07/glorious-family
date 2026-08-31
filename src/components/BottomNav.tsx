'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, LayoutDashboard, Utensils, ShoppingCart, Users, Settings, LogOut, Menu, X, Wallet, FileText, ClipboardList, Activity, PieChart, Key, Banknote, Shield } from 'lucide-react'
import { AuthService } from '@/services/auth.service'
import Logo from './Logo'
import Swal from 'sweetalert2'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    AuthService.getCurrentUser().then(user => {
      if (user?.email === 'iqbalhossen0711@gmail.com') setIsSuperAdmin(true)
    })
  }, [])

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      setMenuOpen(false)
      Swal.fire({
        icon: 'success',
        title: 'Logged out',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
      router.push('/login')
    } catch (error) {}
  }

  // All nav items with their unique colors
  const allItems = [
    { name: 'Home', path: '/dashboard', icon: <Home size={16} />, color: '#3b82f6' },
    { name: 'Members', path: '/dashboard/members', icon: <Users size={16} />, color: '#f43f5e' },
    { name: 'Room Rents', path: '/dashboard/room-rents', icon: <Key size={16} />, color: '#f59e0b' },
    { name: 'Bazar', path: '/dashboard/bazar', icon: <ShoppingCart size={16} />, color: '#10b981' },
    { name: 'Meals', path: '/dashboard/meals', icon: <Utensils size={16} />, color: '#f59e0b' },
    { name: 'Deposits', path: '/dashboard/deposits', icon: <Wallet size={16} />, color: '#0ea5e9' },
    { name: 'Others', path: '/dashboard/other-expenses', icon: <FileText size={16} />, color: '#8b5cf6' },
    { name: 'Info', path: '/dashboard/mess-info', icon: <ClipboardList size={16} />, color: '#ec4899' },
    { name: 'Summary', path: '/dashboard/summary', icon: <PieChart size={16} />, color: '#14b8a6' },
    { name: 'Settlements', path: '/dashboard/settlements', icon: <Banknote size={16} />, color: '#8b5cf6' },
    { name: 'Activity', path: '/dashboard/activity-log', icon: <Activity size={16} />, color: '#f97316' },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={16} />, color: '#64748b' },
  ]

  if (isSuperAdmin) {
    allItems.push({ name: 'Super Admin', path: '/dashboard/super-admin', icon: <Shield size={16} />, color: '#ef4444' })
  }

  // Only these 5 appear on the sticky bottom bar
  const stickyPaths = ['/dashboard', '/dashboard/other-expenses', '/dashboard/members', '/dashboard/meals', '/dashboard/bazar']
  const stickyItems = allItems.filter(item => stickyPaths.includes(item.path))

  return (
    <>
      <nav className="hide-on-desktop" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.3rem 0.5rem',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0.3rem) + 0.2rem)',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
      }}>
        {stickyItems.map((item) => {
          const isActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path)
          return (
            <Link key={item.path} href={item.path} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem',
              padding: '0.3rem 0.1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              background: isActive ? item.color : `${item.color}10`,
              border: '1px solid transparent',
              boxShadow: isActive ? `0 4px 12px ${item.color}40` : 'none',
              color: isActive ? '#fff' : item.color,
              fontWeight: isActive ? 700 : 500,
              flex: 1,
              transition: 'all 0.2s ease'
            }}>
              <div style={{ color: isActive ? '#fff' : item.color }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '0.6rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{item.name}</span>
            </Link>
          )
        })}
        
        {/* Hamburger Menu Button */}
        <button onClick={() => setMenuOpen(true)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem',
          padding: '0.3rem 0.1rem',
          borderRadius: '8px',
          background: menuOpen ? 'rgba(12, 173, 121, 0.15)' : 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(0,0,0,0.02)',
          boxShadow: menuOpen ? '0 4px 12px rgba(12, 173, 121, 0.25)' : '0 2px 6px rgba(148, 163, 184, 0.15)',
          color: menuOpen ? 'var(--primary)' : '#64748b',
          fontWeight: menuOpen ? 700 : 500,
          flex: 1,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <Menu size={16} />
          <span style={{ fontSize: '0.6rem' }}>Menu</span>
        </button>
      </nav>

      {/* Full-width Mobile Menu Overlay */}
      <div className="hide-on-desktop" style={{
        position: 'fixed',
        top: 0,
        left: menuOpen ? 0 : '-100%',
        width: '100%',
        height: '100vh',
        background: 'rgba(248, 250, 252, 0.98)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 300,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Logo size="sm" />
          <button onClick={() => setMenuOpen(false)} className="icon-floating" style={{ border: 'none', cursor: 'pointer', background: '#fff', borderRadius: '50%', padding: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <X size={20} color="var(--text-main)" />
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {allItems.map((item) => {
            const isActive = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path)
            return (
              <Link key={item.path} href={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-main)',
                background: isActive ? item.color : `${item.color}10`,
                boxShadow: isActive ? `0 4px 15px ${item.color}40` : '0 2px 8px rgba(148, 163, 184, 0.1)',
                border: isActive ? '1px solid transparent' : '1px solid rgba(0,0,0,0.02)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '1rem',
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
      </div>
    </>
  )
}
