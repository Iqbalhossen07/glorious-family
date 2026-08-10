import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'

export default function WelcomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-main)' }}>
      
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '650px', 
        width: '100%',
        background: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 32px rgba(148, 163, 184, 0.1)',
        borderRadius: 'var(--radius-md)',
        padding: '3.5rem 2rem'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Logo size="lg" />
        </div>

        {/* Minimal Headline */}
        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
          Manage your mess, <span style={{ color: 'var(--primary)' }}>beautifully.</span>
        </h1>

        {/* Minimal Subtitle */}
        <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          A sleek, intelligent system to track daily meals and calculate monthly expenses without the clutter.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', borderRadius: '8px', fontSize: '1rem' }}>
            Get Started 
            <div className="icon-floating" style={{ padding: '0.2rem', marginLeft: '0.75rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'none', borderRadius: '50%' }}>
              <ArrowRight size={16} color="white" />
            </div>
          </Link>
          <Link href="/login" className="btn btn-outline" style={{ 
            padding: '0.8rem 1.8rem', 
            borderRadius: '8px', 
            fontSize: '1rem', 
            background: 'rgba(255, 255, 255, 0.3)', 
            border: '2px solid #ffffff',
            backdropFilter: 'blur(10px)',
            color: 'var(--text-main)',
            fontWeight: 600
          }}>
            Sign In
          </Link>
        </div>

      </div>

    </main>
  )
}
