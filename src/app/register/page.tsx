'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (email === 'iqbalhossen0711@gmail.com') {
      return MySwal.fire({
        icon: 'error',
        title: 'Reserved Email',
        text: 'This email is reserved for the Super Admin.',
        confirmButtonColor: 'var(--primary)'
      })
    }

    if (password.length < 6) {
      return MySwal.fire({
        icon: 'warning',
        title: 'Oops...',
        text: 'Password must be at least 6 characters',
        confirmButtonColor: 'var(--primary)'
      })
    }

    setLoading(true)
    try {
      await AuthService.register(name, email, password)
      
      await MySwal.fire({
        icon: 'success',
        title: 'Welcome!',
        text: 'Account created successfully. Please login.',
        confirmButtonColor: 'var(--primary)',
        timer: 3000
      })
      
      router.push('/login')
    } catch (error: any) {
      const errorMsg = (error?.message || error?.toString() || '').toLowerCase()
      
      if (errorMsg.includes('already registered') || errorMsg.includes('unique constraint')) {
        MySwal.fire({
          icon: 'error',
          title: 'Already Exists',
          text: 'This email is already registered. Please login instead.',
          confirmButtonColor: 'var(--primary)',
          showCancelButton: true,
          confirmButtonText: 'Go to Login',
          cancelButtonText: 'Try Again'
        }).then((result) => {
          if (result.isConfirmed) {
            router.push('/login')
          }
        })
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error?.message || 'Something went wrong',
          confirmButtonColor: 'var(--primary)'
        })
        
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          alert('Error: ' + (error?.message || 'Something went wrong'))
        }
      }
    } finally {
      setLoading(false)
    }
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
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem' }}>Join the Glorious Family Mess.</p>
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input 
              type="text" className="input-field" placeholder="Your Name" 
              value={name} onChange={(e) => setName(e.target.value)} required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" className="input-field" placeholder="your@email.com" 
              value={email} onChange={(e) => setEmail(e.target.value)} required 
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
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>
            Already have an account? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
