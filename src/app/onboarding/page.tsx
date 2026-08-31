'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/auth.service'
import { MessService } from '@/services/mess.service'
import Swal from 'sweetalert2'

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

  if (loading) return <div className="loading-spinner">Loading...</div>

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        
        {mode === 'select' && (
          <>
            <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Welcome, {user?.name}!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You don't belong to any mess yet. What would you like to do?</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => setMode('create')}
                className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem' }}>
                🏢 Create a New Mess
              </button>
              <button 
                onClick={() => setMode('join')}
                className="btn btn-outline" style={{ padding: '1rem', fontSize: '1.1rem' }}>
                🤝 Join an Existing Mess
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateMess} style={{ textAlign: 'left' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create New Mess</h2>
            <div className="form-group">
              <label>Mess Name</label>
              <input type="text" className="form-control" required value={messName} onChange={e => setMessName(e.target.value)} placeholder="e.g. Super Boys Hostel" />
            </div>
            <div className="form-group">
              <label>Address (Optional)</label>
              <input type="text" className="form-control" value={messAddress} onChange={e => setMessAddress(e.target.value)} placeholder="e.g. Dhanmondi, Dhaka" />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" onClick={() => setMode('select')} className="btn btn-outline" style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinMess} style={{ textAlign: 'left' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Join a Mess</h2>
            <div className="form-group">
              <label>Join Code</label>
              <input type="text" className="form-control" required value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="e.g. MESS-XYZ123" style={{ textTransform: 'uppercase' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" onClick={() => setMode('select')} className="btn btn-outline" style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Join</button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
