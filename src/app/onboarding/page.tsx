'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/auth.service'
import { MessService } from '@/services/mess.service'
import Swal from 'sweetalert2'
import Logo from '@/components/Logo'
import { ArrowLeft, Building, Users } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  
  // Form states
  const [messName, setMessName] = useState('')
  const [messAddress, setMessAddress] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      
      if (currentUser.mess_id) {
        router.push('/dashboard')
        return
      }
      
      setUser(currentUser)
      setLoading(false)
    } catch (error) {
      console.error(error)
      router.push('/login')
    }
  }

  const handleCreateMess = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const newMess = await MessService.createMess(messName, messAddress, user.id)
      await Swal.fire({
        title: 'Success!',
        html: `Your mess <b>${newMess.name}</b> has been created!<br><br>Your Join Code is: <b>${newMess.join_code}</b><br><small>Share this with your members so they can join.</small>`,
        icon: 'success'
      })
      window.location.href = '/dashboard' // Hard refresh to reload context
    } catch (error: any) {
      setLoading(false)
      Swal.fire('Error', error.message, 'error')
    }
  }

  const handleJoinMess = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const joinedMess = await MessService.joinMess(joinCode, user.id)
      await Swal.fire({
        title: 'Welcome!',
        text: `You have successfully joined ${joinedMess.name}`,
        icon: 'success',
        timer: 2000
      })
      window.location.href = '/dashboard'
    } catch (error: any) {
      setLoading(false)
      Swal.fire('Error', error.message, 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading onboarding...
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      <div className="minimal-card" style={{ width: '100%', maxWidth: '420px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo size="md" />
        </div>

        {mode === 'select' && (
          <>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Welcome, {user?.name?.split(' ')[0]}!</h1>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem' }}>You don't belong to any mess yet. What would you like to do?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              <button 
                onClick={() => setMode('create')}
                className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Building size={20} /> Create a New Mess
              </button>
              <button 
                onClick={() => setMode('join')}
                className="btn btn-outline" style={{ padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Users size={20} color="var(--primary)" /> Join an Existing Mess
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateMess}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <button type="button" onClick={() => setMode('select')} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', border: 'none', background: 'transparent' }}>
                <div className="icon-floating" style={{ padding: '0.2rem' }}>
                  <ArrowLeft size={16} color="var(--primary)" />
                </div> 
                Back
              </button>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Create New Mess</h1>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Setup your mess workspace</p>

            <div className="input-group">
              <label className="input-label">Mess Name</label>
              <input type="text" className="input-field" required value={messName} onChange={e => setMessName(e.target.value)} placeholder="e.g. Super Boys Hostel" />
            </div>
            
            <div className="input-group" style={{ marginBottom: '2.5rem' }}>
              <label className="input-label">Address (Optional)</label>
              <input type="text" className="input-field" value={messAddress} onChange={e => setMessAddress(e.target.value)} placeholder="e.g. Dhanmondi, Dhaka" />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              Create Mess
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinMess}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <button type="button" onClick={() => setMode('select')} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', border: 'none', background: 'transparent' }}>
                <div className="icon-floating" style={{ padding: '0.2rem' }}>
                  <ArrowLeft size={16} color="var(--primary)" />
                </div> 
                Back
              </button>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Join a Mess</h1>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>Enter the code provided by your manager</p>

            <div className="input-group" style={{ marginBottom: '2.5rem' }}>
              <label className="input-label">Join Code</label>
              <input type="text" className="input-field" required value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="e.g. MESS-XYZ123" style={{ textTransform: 'uppercase' }} />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              Join Mess
            </button>
          </form>
        )}

      </div>
    </main>
  )
}
