'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Banknote, History } from 'lucide-react'
import { SessionService } from '@/services/session.service'
import { SettlementService } from '@/services/settlement.service'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { BazarService } from '@/services/bazar.service'
import { DepositService } from '@/services/deposit.service'
import { FixedExpenseService } from '@/services/fixed_expense.service'
import { supabase } from '@/lib/supabase'
import Swal from 'sweetalert2'

export default function SettlementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [settlements, setSettlements] = useState<any[]>([])
  
  const [messStats, setMessStats] = useState<any>({})
  const [memberStats, setMemberStats] = useState<any>({})

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      loadSettlements(selectedSession)
    }
  }, [selectedSession])

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'closed')
        .order('created_at', { ascending: false })
      
      if (error) throw new Error(error.message)
      
      setSessions(data || [])
      if (data && data.length > 0) {
        setSelectedSession(data[0].id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const loadSettlements = async (sessionId: string) => {
    setLoading(true)
    try {
      const [data, membersData, mealsData, bazarData, depositsData, fixedData] = await Promise.all([
        SettlementService.getSettlementsBySession(sessionId),
        MemberService.getAllMembers(),
        MealService.getMealHistory(sessionId),
        BazarService.getBazarHistory(sessionId),
        DepositService.getDepositHistory(sessionId),
        FixedExpenseService.getFixedExpenseHistory(sessionId)
      ])

      // Calculate totals
      const tMeals = mealsData.reduce((sum, m) => sum + Number(m.meal_count), 0)
      const tBazar = bazarData.reduce((sum, b) => sum + Number(b.amount), 0)
      const tFixed = fixedData.reduce((sum, f) => sum + Number(f.amount), 0)
      
      const mRate = tMeals > 0 ? (tBazar / tMeals) : 0
      const activeMembersCount = membersData.length
      const fixedCostPerMember = activeMembersCount > 0 ? (tFixed / activeMembersCount) : 0

      setMessStats({
        totalMeals: tMeals,
        totalBazar: tBazar,
        mealRate: mRate,
        sharedFixedExpense: fixedCostPerMember
      })

      const mStats: any = {}
      membersData.forEach(member => {
         const memberMeals = mealsData.filter(m => m.user_id === member.id).reduce((sum, m) => sum + Number(m.meal_count), 0)
         const memberDeposits = depositsData.filter(d => d.user_id === member.id).reduce((sum, d) => sum + Number(d.amount), 0)
         const memberBazar = bazarData.filter(b => b.user_id === member.id).reduce((sum, b) => sum + Number(b.amount), 0)
         const memberPaidFixed = fixedData.filter(f => f.user_id === member.id).reduce((sum, f) => sum + Number(f.amount), 0)
         
         const totalPaid = memberDeposits + memberBazar + memberPaidFixed
         const totalExpense = (memberMeals * mRate) + fixedCostPerMember
         
         mStats[member.id] = {
           totalExpense,
           totalPaid
         }
      })
      setMemberStats(mStats)
      setSettlements(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearSettlement = async (id: string, name: string, type: string, amount: number) => {
    const actionText = type === 'receivable' ? 'received money from' : 'refunded money to'
    
    const result = await Swal.fire({
      title: 'Clear Settlement?',
      text: `Have you ${actionText} ${name} (৳${Number(amount).toFixed(2)})?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, Cleared'
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        await SettlementService.clearSettlement(id)
        await loadSettlements(selectedSession)
        Swal.fire('Success', 'Settlement cleared!', 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Settlements</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage dues and refunds for closed months</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
          <History size={48} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No closed sessions yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Close a month from the Summary page to see settlements.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select 
              value={selectedSession} 
              onChange={(e) => setSelectedSession(e.target.value)}
              className="input-field"
              style={{ maxWidth: '300px', background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '8px', padding: '0.6rem 1rem' }}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.session_name}</option>
              ))}
            </select>
          </div>

          {!loading && messStats && settlements.length > 0 && (
            <div className="minimal-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>Mess Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Meals</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{messStats.totalMeals}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Bazar</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>৳ {Number(messStats.totalBazar).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Meal Rate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>৳ {Number(messStats.mealRate).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Shared Fixed Exp.</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f59e0b' }}>৳ {Number(messStats.sharedFixedExpense).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
             <div style={{ color: 'var(--text-muted)' }}>Loading settlements...</div>
          ) : settlements.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '12px' }}>
              No settlements found for this month. Everyone's balance was exactly zero!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {settlements.map(s => {
                const stat = memberStats[s.user_id] || { totalExpense: 0, totalPaid: 0 }
                return (
                  <div key={s.id} className="minimal-card" style={{ padding: '1.5rem', background: s.status === 'cleared' ? 'rgba(12, 173, 121, 0.05)' : 'rgba(255, 255, 255, 0.4)', border: s.status === 'cleared' ? '1px solid rgba(12, 173, 121, 0.3)' : '1px solid rgba(255,255,255,0.6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{s.user?.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {s.type === 'receivable' ? 'Member owes mess' : 'Mess owes member'}
                        </p>
                      </div>
                      {s.status === 'cleared' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(12, 173, 121, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>
                          <CheckCircle size={14} /> Cleared
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Expense</span>
                        <span style={{ fontWeight: 600 }}>৳ {Number(stat.totalExpense).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Paid</span>
                        <span style={{ fontWeight: 600 }}>৳ {Number(stat.totalPaid).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{s.status === 'cleared' ? (s.type === 'receivable' ? 'Settled (Paid by Member)' : 'Settled (Refunded to Member)') : (s.type === 'receivable' ? 'Current Due' : 'Refund Amount')}</span>
                        <span style={{ fontWeight: 700, color: s.status === 'cleared' ? 'var(--primary)' : (s.type === 'receivable' ? '#ef4444' : 'var(--primary)') }}>৳ {Number(s.amount).toFixed(2)}</span>
                      </div>
                      {s.status === 'cleared' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Current Due</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>৳ 0.00</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {s.status === 'pending' && (
                        <button 
                          onClick={() => handleClearSettlement(s.id, s.user?.name, s.type, s.amount)} 
                          className="btn btn-primary submit-btn" 
                          style={{ width: '100%', background: s.type === 'receivable' ? 'var(--primary)' : '#6366f1' }}
                        >
                          <Banknote size={16} /> {s.type === 'receivable' ? 'Mark as Received' : 'Mark as Refunded'}
                        </button>
                      )}
                      {s.status === 'cleared' && (
                        <button 
                          onClick={() => router.push(`/dashboard/invoice/${s.session_id}/${s.user_id}`)}
                          className="btn" 
                          style={{ width: '100%', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-main)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Invoice
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

    </div>
  )
}
