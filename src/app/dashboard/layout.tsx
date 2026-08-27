import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import MobileTopBar from '@/components/MobileTopBar'
import { SessionProvider } from '@/context/SessionContext'
import GlobalSessionSelector from '@/components/GlobalSessionSelector'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
