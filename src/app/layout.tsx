import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glorious Family Mess',
  description: 'Premium Mess Management Application',
  manifest: '/manifest.json',
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
