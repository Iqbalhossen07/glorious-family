'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    alert('Login feature coming next!')
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      
      <div className="minimal-card" style={{ width: '100%', maxWidth: '420px' }}>
        
        {/* Back Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div className="icon-floating" style={{ padding: '0.2rem' }}>
              <ArrowLeft size={16} color="var(--primary)" />
            </div> 
            Back
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo size="md" />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem' }}>Enter your details to sign in.</p>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <input 
              type="tel" className="input-field" placeholder="01700000000" 
              value={phone} onChange={(e) => setPhone(e.target.value)} required 
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '2.5rem', position: 'relative' }}>
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" 
                value={password} onChange={(e) => setPassword(e.target.value)} required 
                style={{ paddingRight: '3.5rem' }}
              />
              <button 
                type="button"
                className="icon-floating"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', padding: '0.35rem' }}
              >
                {showPassword ? <EyeOff size={18} color="var(--primary)" /> : <Eye size={18} color="var(--primary)" />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>
            Don't have an account? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign up</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
