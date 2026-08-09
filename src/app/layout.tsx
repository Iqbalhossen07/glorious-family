import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glorious Family Mess',
  description: 'Manage your mess, beautifully.',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="container animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  )
}
