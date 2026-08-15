'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, ArrowLeft, CheckCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import { SessionService } from '@/services/session.service'
import { AuthService } from '@/services/auth.service'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { BazarService } from '@/services/bazar.service'
import { DepositService } from '@/services/deposit.service'
import { FixedExpenseService } from '@/services/fixed_expense.service'
import { useSessionContext } from '@/context/SessionContext'

export default function SummaryPage() {
  const router = useRouter()
  const { selectedSession: session, isLoading: isSessionLoading, reloadSessions, changeSession } = useSessionContext()
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [mealRate, setMealRate] = useState(0)
  const [sharedExpense, setSharedExpense] = useState(0)
  const [memberStats, setMemberStats] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!session) return
      try {
        setLoading(true)
        const currentSession = session

        if (currentSession) {
          const [membersData, mealsData, bazarData, depositsData, fixedData] = await Promise.all([
            MemberService.getAllMembers(),
            MealService.getMealHistory(currentSession.id),
            BazarService.getBazarHistory(currentSession.id),
            DepositService.getDepositHistory(currentSession.id),
            FixedExpenseService.getFixedExpenseHistory(currentSession.id)
          ])

          // All Other Expenses (Mess Fund + Paid by Members) are shared equally
          const allOtherExpenses = fixedData.filter((f: any) => f.item_name !== 'Room Rent')
          const roomRentsData = fixedData.filter((f: any) => f.item_name === 'Room Rent')

          // Calculate totals
          const tMeals = mealsData.reduce((sum: any, m: any) => sum + Number(m.meal_count), 0)
          const tBazar = bazarData.reduce((sum: any, b: any) => sum + Number(b.amount), 0)
          const tSharedFixed = allOtherExpenses.reduce((sum: any, f: any) => sum + Number(f.amount), 0)
          const mRate = tMeals > 0 ? (tBazar / tMeals) : 0

          // Determine relevant members
          let relevantMembers = membersData.map(member => {
             const memberMeals = mealsData.filter((m: any) => m.user_id === member.id).reduce((sum: any, m: any) => sum + Number(m.meal_count), 0)
             const memberDeposits = depositsData.filter((d: any) => d.user_id === member.id).reduce((sum: any, d: any) => sum + Number(d.amount), 0)
             const memberBazar = bazarData.filter((b: any) => b.user_id === member.id).reduce((sum: any, b: any) => sum + Number(b.amount), 0)
             
             // Room rent and other expenses paid by member
             const memberRoomRent = roomRentsData.filter((f: any) => f.user_id === member.id).reduce((sum: any, f: any) => sum + Number(f.amount), 0)
             const memberPaidFixed = allOtherExpenses.filter((f: any) => f.user_id === member.id).reduce((sum: any, f: any) => sum + Number(f.amount), 0)
             
             const hasActivity = memberMeals > 0 || memberDeposits !== 0 || memberBazar > 0 || memberRoomRent > 0 || memberPaidFixed > 0
             
             return {
               ...member,
               hasActivity,
               totalMeals: memberMeals,
               totalDeposit: memberDeposits,
               totalBazarPaid: memberBazar,
               memberRoomRent: memberRoomRent,
               memberPaidFixed: memberPaidFixed,
               totalGiven: memberDeposits + memberBazar + memberPaidFixed
             }
          }).filter(m => m.status === 'active' || m.hasActivity)

          const activeMembersCount = relevantMembers.length
          const sharedCostPerMember = activeMembersCount > 0 ? (tSharedFixed / activeMembersCount) : 0

          setMealRate(mRate)
          setSharedExpense(sharedCostPerMember)

          const stats = relevantMembers.map(member => {
             const mealCost = member.totalMeals * mRate
             const totalCost = mealCost + sharedCostPerMember + member.memberRoomRent
             const balance = member.totalGiven - totalCost
             
             return {
               ...member,
               mealCost: mealCost,
               totalCost: totalCost,
               balance: balance
             }
          })
          setMemberStats(stats)
        }
      } catch (error) {
        console.error("Error loading summary:", error)
      } finally {
        setLoading(false)
      }
    }
    if (session) {
      loadData()
    }
  }, [session, router])

  const handleCloseMonth = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to close this month? This action cannot be undone and no more data can be added.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Close Month'
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        
        const settlements = memberStats.map(stat => {
          let amount = stat.balance
          let type: 'payable' | 'receivable' = 'payable'
          if (amount < 0) {
            amount = Math.abs(amount)
            type = 'receivable'
          }
          return {
            user_id: stat.id,
            amount: amount,
            type: type
          }
        })

        await SessionService.closeSession(session.id, settlements)
        await reloadSessions()
        
        await Swal.fire('Success', 'Month closed successfully. Balances have been saved to Settlements.', 'success')
        router.push('/dashboard/settlements')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleReopenMonth = async () => {
    const result = await Swal.fire({
      title: 'Re-open this month?',
      text: "This will delete all current settlements for this month and make it editable again.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Yes, Re-open Month'
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        await SessionService.reopenSession(session.id)
        await reloadSessions()
        changeSession(session.id)
        Swal.fire('Success', 'Month has been re-opened successfully.', 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  if (!isClient || isSessionLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2>No Active Session</h2>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      {session?.status === 'closed' && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <strong>Notice:</strong> This month is closed. Data is read-only.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Final Summary</h1>
            <p style={{ color: 'var(--text-muted)' }}>{session.session_name} Overview</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {session && session.status === 'closed' && (
            <button onClick={handleReopenMonth} className="btn" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
              Re-open this Month
            </button>
          )}
          {session && session.status !== 'closed' && (
            <button onClick={handleCloseMonth} className="btn btn-primary submit-btn" style={{ background: '#ef4444' }}>
              <CheckCircle size={18} /> Close Month
            </button>
          )}
        </div>
      </div>

      <div className="minimal-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Meal Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>৳ {Number(mealRate).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Per Person Shared Exp.</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>৳ {Number(sharedExpense).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <>
        {/* Desktop Table View */}
        <div className="responsive-table hide-on-mobile" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', overflowX: 'auto' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Member</th>
                <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Meals</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Meal Cost</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Other Cost</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Room Rent</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Bazar</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Deposit</th>
                <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status (Payable)</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((stat, i) => (
                <tr key={stat.id} style={{ borderBottom: i === memberStats.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{stat.name}</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 500 }}>{Number(stat.totalMeals).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>৳ {Number(stat.mealCost).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>৳ {Number(sharedExpense).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>৳ {Number(stat.memberRoomRent).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>৳ {Number(stat.totalBazarPaid).toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    ৳ {Number(stat.totalDeposit).toFixed(2)}
                    {stat.memberPaidFixed > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(+৳ {Number(stat.memberPaidFixed).toFixed(0)} Oth.)</div>}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {stat.balance >= 0 ? (
                      <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        + ৳ {Number(stat.balance).toFixed(2)}
                        <div style={{ fontSize: '0.75rem', fontWeight: 400 }}>(Receivable)</div>
                      </div>
                    ) : (
                      <div style={{ color: '#ef4444', fontWeight: 700 }}>
                        ৳ {Number(Math.abs(stat.balance)).toFixed(2)}
                        <div style={{ fontSize: '0.75rem', fontWeight: 400 }}>(Payable)</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="hide-on-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {memberStats.map((stat) => (
            <div key={stat.id} className="minimal-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{stat.name}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{Number(stat.totalMeals).toFixed(2)} Meals</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Meal Cost</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>৳ {Number(stat.mealCost).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Other Cost</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>৳ {Number(sharedExpense).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room Rent</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f59e0b' }}>৳ {Number(stat.memberRoomRent).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Cost</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>৳ {Number(stat.totalCost).toFixed(2)}</div>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.8rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bazar Done</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>৳ {Number(stat.totalBazarPaid).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deposit Given</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      ৳ {Number(stat.totalDeposit).toFixed(2)}
                    </div>
                    {stat.memberPaidFixed > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(+৳ {Number(stat.memberPaidFixed).toFixed(0)} Oth.)</div>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
                {stat.balance >= 0 ? (
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>+ ৳ {Number(stat.balance).toFixed(2)} (Receivable)</span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>৳ {Number(Math.abs(stat.balance)).toFixed(2)} (Payable)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </>

    </div>
  )
}
