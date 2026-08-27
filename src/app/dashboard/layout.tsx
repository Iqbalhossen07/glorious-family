'use client'

import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import MobileTopBar from '@/components/MobileTopBar'
import { SessionProvider } from '@/context/SessionContext'
import GlobalSessionSelector from '@/components/GlobalSessionSelector'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isInvoicePage = pathname && pathname.startsWith('/dashboard/invoice')

  if (isInvoicePage) {
    return (
      <AuthGuard>
        <SessionProvider>
          <main style={{ minHeight: '100vh', background: '#f1f5f9' }}>
            {children}
          </main>
        </SessionProvider>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <SessionProvider>
        <div style={{ minHeight: '100vh', display: 'flex' }}>
          <MobileTopBar />
          <Sidebar />
          <BottomNav />
          <main className="dashboard-main">
            <GlobalSessionSelector />
            {children}
          </main>
        </div>
      </SessionProvider>
    </AuthGuard>
  )
}
