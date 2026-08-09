'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Save, ArrowLeft, Calendar, User, List } from 'lucide-react'
import { SessionService } from '@/services/session.service'
import { MemberService } from '@/services/member.service'
import { FixedExpenseService } from '@/services/fixed_expense.service'
import { AuthService } from '@/services/auth.service'
import Swal from 'sweetalert2'

export default function AddFixedExpensePage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [userId, setUserId] = useState('MESS_FUND') // Default to Mess Fund
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const authSession = await AuthService.getSession()
        setUser(authSession?.user)

        const currentSession = await SessionService.getCurrentSession()
        setSession(currentSession)

        if (currentSession) {
          const membersData = await MemberService.getAllMembers()
          setMembers(membersData)
        }
      } catch (error) {
        console.error("Error loading members:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !user) return

    if (Number(amount) < 0) {
      Swal.fire('Error', 'Amount cannot be negative.', 'error')
      return
    }

    if (!date || !itemName || !amount || Number(amount) === 0) {
      Swal.fire('Error', 'Please fill all fields correctly.', 'error')
      return
    }

    const actualUserId = userId === 'MESS_FUND' ? null : userId

    try {
      Swal.showLoading()
      await FixedExpenseService.addFixedExpense(session.id, actualUserId, date, itemName, Number(amount), user.id)
      await Swal.fire('Success!', 'Other expense added successfully.', 'success')
      router.push('/dashboard/other-expenses')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2>No Active Session</h2>
        <button onClick={() => router.push('/dashboard')} className="btn btn-primary submit-btn" style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/dashboard/other-expenses')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Add Other Expense</h1>
          <p style={{ color: 'var(--text-muted)' }}>Record shared miscellaneous expense</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)' }}>
        
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label className="input-label">Date</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <Calendar size={18} color="var(--text-muted)" />
              <input 
                type="date" 
                className="input-field"
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Expense Details (e.g. Cook Salary, Gas Bill)</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <List size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                className="input-field"
                value={itemName} 
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Gas Bill"
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Paid By (Who paid this?)</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <User size={18} color="var(--text-muted)" />
              <select 
                className="input-field"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ border: 'none', boxShadow: 'none', fontWeight: userId === 'MESS_FUND' ? 700 : 400, color: userId === 'MESS_FUND' ? '#8b5cf6' : 'var(--text-main)' }}
                required
              >
                <option value="MESS_FUND">Mess Fund (Manager Balance)</option>
                <optgroup label="Members">
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            {userId === 'MESS_FUND' && <p style={{ fontSize: '0.8rem', color: '#8b5cf6', marginTop: '0.5rem' }}>* Will be deducted from manager's balance.</p>}
            {userId !== 'MESS_FUND' && <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem' }}>* Will be added to this member's total deposit.</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Total Amount (৳)</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <strong style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>৳</strong>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="input-field"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ border: 'none', boxShadow: 'none', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary submit-btn" >
              <Save size={20} /> Save Expense
            </button>
          </div>

        </form>

      </div>

    </div>
  )
}
