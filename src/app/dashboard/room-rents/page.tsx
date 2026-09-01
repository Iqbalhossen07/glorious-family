'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Save, ArrowLeft } from 'lucide-react'
import { SessionService } from '@/services/session.service'
import { MemberService } from '@/services/member.service'
import { FixedExpenseService } from '@/services/fixed_expense.service'
import { AuthService } from '@/services/auth.service'
import { createClient } from '@supabase/supabase-js'
import Swal from 'sweetalert2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type RoomRentState = {
  [userId: string]: number
}

export default function RoomRentsPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rentData, setRentData] = useState<RoomRentState>({})

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const authSession = await AuthService.getSession()
        setUser(authSession?.user)

        const membersData = await MemberService.getAllMembers()
        const activeMembers = membersData.filter(m => m.status === 'active')
        setMembers(activeMembers)
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }
    loadInitial()
  }, [])

  useEffect(() => {
    const loadSessionRents = async () => {
      if (members.length === 0) return
      try {
        setLoading(true)
        const targetSession = await SessionService.getSessionForDate(date)
        setSession(targetSession)

        if (targetSession) {
          const { data: existingRents, error } = await supabase
            .from('fixed_expenses')
            .select('*')
            .eq('session_id', targetSession.id)
            .eq('item_name', 'Room Rent')

          const initialRents: RoomRentState = {}
          members.forEach((m) => {
            const memberRent = existingRents?.find(r => r.user_id === m.id)
            initialRents[m.id] = memberRent ? Number(memberRent.amount) : 1225
          })
          
          // DO NOT override the date the user just picked
          // If we want to set it to existing date, we only do it if it's the exact same session
          
          setRentData(initialRents)
        }
      } catch (error) {
        console.error("Error loading session rents:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSessionRents()
  }, [date, members])

  const handleInputChange = (userId: string, value: string) => {
    let numValue = value === '' ? 0 : parseFloat(value)
    if (numValue < 0) {
       Swal.fire({
         icon: 'error',
         title: 'Invalid Input',
         text: 'Values cannot be negative.'
       })
       return
    }
    
    setRentData(prev => ({
      ...prev,
      [userId]: numValue
    }))
  }

  const handleSaveAll = async () => {
    if (!user) return

    try {
      Swal.showLoading()

      const targetSession = await SessionService.getSessionForDate(date)
      if (!targetSession) throw new Error("No session found for this date")
      
      await supabase.from('fixed_expenses')
        .delete()
        .eq('session_id', targetSession.id)
        .eq('item_name', 'Room Rent')

      const rentsToInsert: any[] = []

      Object.keys(rentData).forEach(userId => {
        const amount = rentData[userId]
        if (amount > 0) {
          rentsToInsert.push({
            session_id: targetSession.id,
            user_id: userId,
            date: date,
            item_name: 'Room Rent',
            amount: amount,
            created_by: user.id
          })
        }
      })

      if (rentsToInsert.length > 0) {
        const { error } = await supabase.from('fixed_expenses').insert(rentsToInsert)
        if (error) throw new Error(error.message)
      }

      await Swal.fire('Success!', 'Room rents saved successfully.', 'success')
      router.push('/dashboard')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
  if (!session) return <div style={{ padding: '2rem' }}><h2>No Active Session</h2></div>

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Manage Room Rents</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Set individual room rents for active members</p>
        </div>
      </div>

      <div className="minimal-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Date
          </label>
          <div style={{ position: 'relative', maxWidth: '300px' }}>
            <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '3rem', width: '100%', fontSize: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}
              required
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Member Name</div>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Amount</div>
          </div>

          {members.map(member => (
            <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.name}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>৳</span>
                <input 
                  type="number" 
                  step="any"
                  min="0"
                  value={rentData[member.id] || ''}
                  onChange={(e) => handleInputChange(member.id, e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', textAlign: 'right', padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  placeholder="0"
                />
              </div>
            </div>
          ))}
          {members.length === 0 && (
             <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>No active members found.</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleSaveAll}
          className="btn btn-primary submit-btn" 
          style={{ padding: '0.8rem 2rem', fontSize: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 20px rgba(95, 99, 98, 0.3)' }}
        >
          <Save size={18} /> Save Rents
        </button>
      </div>

    </div>
  )
}
