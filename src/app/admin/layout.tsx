'use client'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import MobileTopBar from '@/components/MobileTopBar'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <MobileTopBar />
      <Sidebar />
      <BottomNav />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
