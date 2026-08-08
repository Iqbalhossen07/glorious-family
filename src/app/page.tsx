import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'

export default function WelcomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      
      <div style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <Logo size="lg" />
        </div>

        {/* Minimal Headline */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
          Manage your mess, <br/>
          <span style={{ color: 'var(--text-muted)' }}>beautifully.</span>
        </h1>

        {/* Minimal Subtitle */}
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '3.5rem', maxWidth: '450px', margin: '0 auto', lineHeight: 1.6 }}>
          A sleek, intelligent system to track daily meals and calculate monthly expenses without the clutter.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary">
            Get Started 
            <div className="icon-floating" style={{ padding: '0.2rem', marginLeft: '0.75rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'none' }}>
              <ArrowRight size={16} color="white" />
            </div>
          </Link>
          <Link href="/login" className="btn btn-outline">
            Sign In
          </Link>
        </div>

      </div>

    </main>
  )
}
