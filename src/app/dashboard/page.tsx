'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, ShoppingCart, Wallet, PlusCircle, CalendarPlus, Calculator, FileText, User } from 'lucide-react'
import Clock from 'react-clock'
import 'react-clock/dist/Clock.css'
import { SessionService } from '@/services/session.service'
import { AuthService } from '@/services/auth.service'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { BazarService } from '@/services/bazar.service'
import { DepositService } from '@/services/deposit.service'
import { FixedExpenseService } from '@/services/fixed_expense.service'
import { useSessionContext } from '@/context/SessionContext'
import Swal from 'sweetalert2'

export default function DashboardPage() {
  const router = useRouter()
  const { selectedSession: session, isLoading: isSessionLoading, reloadSessions } = useSessionContext()
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Stats
  const [totalMeals, setTotalMeals] = useState(0)
  const [totalBazar, setTotalBazar] = useState(0)
  const [totalDeposit, setTotalDeposit] = useState(0)
  const [totalFixedCost, setTotalFixedCost] = useState(0)
  const [messFundFixedCost, setMessFundFixedCost] = useState(0)
  const [memberStats, setMemberStats] = useState<any[]>([])

  const loadData = async () => {
    try {
      setLoading(true)
      const authSession = await AuthService.getSession()
      setUser(authSession?.user)

      if (session) {
        const [membersData, mealsData, bazarData, depositsData, fixedData] = await Promise.all([
          MemberService.getAllMembers(),
          MealService.getMealHistory(session.id),
          BazarService.getBazarHistory(session.id),
          DepositService.getDepositHistory(session.id),
          FixedExpenseService.getFixedExpenseHistory(session.id)
        ])
        
        setMembers(membersData)

        // Calculate totals
        const tMeals = mealsData.reduce((sum, m) => sum + Number(m.meal_count), 0)
        const tBazar = bazarData.reduce((sum, b) => sum + Number(b.amount), 0)
        const tDeposit = depositsData.reduce((sum, d) => sum + Number(d.amount), 0)
        const tFixed = fixedData.reduce((sum, f) => sum + Number(f.amount), 0)
        
        // Fixed expenses paid directly from the mess fund (user_id is null)
        const messFundFixed = fixedData.filter(f => !f.user_id).reduce((sum, f) => sum + Number(f.amount), 0)

        setTotalMeals(tMeals)
        setTotalBazar(tBazar)
        setTotalDeposit(tDeposit)
        setTotalFixedCost(tFixed)
        setMessFundFixedCost(messFundFixed)

        const mRate = tMeals > 0 ? (tBazar / tMeals) : 0
        const activeMembersCount = membersData.length
        const fixedCostPerMember = activeMembersCount > 0 ? (tFixed / activeMembersCount) : 0

        // Calculate member specific stats
        const stats = membersData.map(member => {
           const memberMeals = mealsData.filter(m => m.user_id === member.id).reduce((sum, m) => sum + Number(m.meal_count), 0)
           const memberDeposits = depositsData.filter(d => d.user_id === member.id).reduce((sum, d) => sum + Number(d.amount), 0)
           const memberPaidFixed = fixedData.filter(f => f.user_id === member.id).reduce((sum, f) => sum + Number(f.amount), 0)
           
           // member paid = deposit cash + out-of-pocket fixed expenses
           const totalPaid = memberDeposits + memberPaidFixed
           
           // member cost = meal cost + their share of fixed cost
           const mealCost = memberMeals * mRate
           const totalCost = mealCost + fixedCostPerMember
           
           // balance = paid - cost
           const balance = totalPaid - totalCost
           
           return {
             ...member,
             totalMeals: memberMeals,
             totalDeposit: memberDeposits,
             totalPaidFixed: memberPaidFixed,
             totalPaid: totalPaid,
             mealCost: mealCost,
             totalCost: totalCost,
             balance: balance
           }
        })
        setMemberStats(stats)
      }
    } catch (error) {
      console.error("Error loading dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSessionLoading) {
      loadData()
    }
    
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [session, isSessionLoading])

  const handleCreateSession = async () => {
    if (!user) return
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date();
    const currentMonthIndex = d.getMonth();
    const currentYear = d.getFullYear();
    
    const options: { [key: string]: string } = {};
    for (let i = currentMonthIndex; i <= 11; i++) {
      const mName = monthNames[i];
      const label = `${mName} ${currentYear}`;
      options[label] = label;
    }

    const { value: sessionName } = await Swal.fire({
      title: 'Start New Month',
      input: 'select',
      inputOptions: options,
      inputPlaceholder: 'Select a month',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      inputValidator: (value) => {
        if (!value) return 'You need to select a month!'
      }
    })

    if (sessionName) {
      try {
        Swal.showLoading()
        await SessionService.createSession(sessionName, user.id)
        await reloadSessions()
        Swal.fire('Success', 'New session started!', 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  if (!isClient || isSessionLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-main)' }}>Overview</h1>
        
        <div className="minimal-card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(12, 173, 121, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <CalendarPlus size={40} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Month</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
            There is no active session running. Start a new month to begin tracking meals and expenses.
          </p>
          <button onClick={handleCreateSession} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(12, 173, 121, 0.2)' }}>
            Start New Month
          </button>
        </div>
      </div>
    )
  }

  const mealRate = totalMeals > 0 ? (totalBazar / totalMeals).toFixed(2) : '0.00'
  
  // Manager Balance = (Total Cash Given to Manager as Deposits) - (Total Bazar Paid by Manager) - (Total Fixed Expenses Paid by Manager/Mess Fund)
  const managerBalance = totalDeposit - totalBazar - messFundFixedCost
  
  const perPersonFixedCost = memberStats.length > 0 ? (totalFixedCost / memberStats.length).toFixed(2) : '0.00'

  const formatTime = (date: Date | null) => {
    if (!date) return { time: '--:--', sec: '--', ampm: '' }
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    const [timePortion, ampm] = timeStr.split(' ')
    const parts = timePortion.split(':')
    return {
      time: `${parts[0]}:${parts[1]}`,
      sec: parts[2],
      ampm: ampm
    }
  }

  const t = formatTime(currentTime)
  
  const currentMember = members.find(m => m.id === user?.id)
  const displayName = currentMember?.name || user?.user_metadata?.name || 'Manager'

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      {session?.status === 'closed' && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#b45309', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CalendarPlus size={18} /> {session.session_name} is Closed</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>This month's data is now read-only. You can view the history but cannot make changes.</p>
          </div>
          <button onClick={handleCreateSession} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.9rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <PlusCircle size={16} /> Start New Month
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(12, 173, 121, 0.08) 0%, rgba(12, 173, 121, 0.02) 100%)',
        border: '1px solid rgba(12, 173, 121, 0.15)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 8px 32px rgba(12, 173, 121, 0.05)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Welcome back, <span style={{ color: 'var(--primary)' }}>{displayName}</span> 
          </h1>
          <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Here is what's happening in <strong style={{ color: 'var(--text-main)' }}>{session.session_name}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(8px)' }}>
          {currentTime && (
            <div className="hide-on-mobile" style={{ background: '#fff', padding: '0.3rem', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <Clock value={currentTime} size={45} renderNumbers={false} secondHandWidth={2} />
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div className="clock-time">
              {t.time}
              <span style={{ fontSize: '0.65em', margin: '0 4px', opacity: 0.7, fontWeight: 600 }}>{t.sec}</span>
              <span style={{ fontSize: '0.55em', fontWeight: 700, opacity: 0.9, letterSpacing: '0px' }}>{t.ampm}</span>
            </div>
            <div className="clock-date">
              {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'Loading date...'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        
        <div className="minimal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="icon-floating stat-card-icon" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <ShoppingCart size={16} color="var(--primary)" />
            </div>
            <h3 className="stat-card-title">Total Bazar</h3>
          </div>
          <p className="stat-card-value">৳ {Number(totalBazar).toFixed(2)}</p>
        </div>

        <div className="minimal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="icon-floating stat-card-icon" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <Utensils size={16} color="var(--primary)" />
            </div>
            <h3 className="stat-card-title">Total Meals</h3>
          </div>
          <p className="stat-card-value">{Number(totalMeals).toFixed(2)}</p>
        </div>

        <div className="minimal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="icon-floating stat-card-icon" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <Calculator size={16} color="var(--primary)" />
            </div>
            <h3 className="stat-card-title">Meal Rate</h3>
          </div>
          <p className="stat-card-value">৳ {mealRate}</p>
        </div>

        <div className="minimal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="icon-floating stat-card-icon" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <FileText size={16} color="var(--primary)" />
            </div>
            <h3 className="stat-card-title">Total Other Exp.</h3>
          </div>
          <p className="stat-card-value">৳ {Number(totalFixedCost).toFixed(2)}</p>
        </div>

        <div className="minimal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="icon-floating stat-card-icon" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <User size={16} color="var(--primary)" />
            </div>
            <h3 className="stat-card-title">Per Person Exp.</h3>
          </div>
          <p className="stat-card-value">৳ {perPersonFixedCost}</p>
        </div>

        <div className="minimal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <div className="icon-floating stat-card-icon" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <Wallet size={16} color="var(--primary)" />
            </div>
            <h3 className="stat-card-title">Total Deposit</h3>
          </div>
          <p className="stat-card-value">৳ {Number(totalDeposit).toFixed(2)}</p>
        </div>

        <div className="minimal-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="icon-floating" style={{ border: 'none', background: 'rgba(12, 173, 121, 0.1)' }}>
              <Wallet size={20} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Manager Balance (Cash in Hand)</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 400, color: managerBalance < 0 ? '#ef4444' : 'var(--primary)' }}>
            ৳ {Number(managerBalance).toFixed(2)}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            (Total Deposits: ৳ {Number(totalDeposit).toFixed(2)}) - (Total Bazar: ৳ {Number(totalBazar).toFixed(2)}) - (Other Exp. Paid by Fund: ৳ {messFundFixedCost})
          </p>
        </div>

      </div>

      {/* Member Statement Table */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Member Statements</h2>
      <>
        {/* Desktop Table View */}
        <div className="responsive-table hide-on-mobile" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', overflowX: 'auto', marginBottom: '3rem' }}>
          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Member</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Meals</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Meal Cost (৳)</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Other Cost (৳)</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Paid (৳)</th>
                <th style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((stat) => (
                <tr key={stat.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {stat.name}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {Number(stat.totalMeals).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#ef4444' }}>
                    {stat.mealCost.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#ef4444' }}>
                    {(stat.totalCost - stat.mealCost).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--primary)' }}>
                    {stat.totalPaid.toFixed(2)}
                    {stat.totalPaidFixed > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Incl. ৳{stat.totalPaidFixed} other)</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>
                    {stat.balance > 0 ? (
                      <span style={{ color: 'var(--primary)', background: 'rgba(12, 173, 121, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                        Receivable: ৳ {stat.balance.toFixed(2)}
                      </span>
                    ) : stat.balance < 0 ? (
                      <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                        Payable: ৳ {Math.abs(stat.balance).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Clear</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="hide-on-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          {memberStats.map((stat) => (
            <div key={stat.id} className="minimal-card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.8rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{stat.name}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{Number(stat.totalMeals).toFixed(2)} Meals</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Meal Cost</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>৳ {stat.mealCost.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Other Cost</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>৳ {(stat.totalCost - stat.mealCost).toFixed(2)}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Paid</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>৳ {stat.totalPaid.toFixed(2)}</div>
                  {stat.totalPaidFixed > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (Incl. ৳{stat.totalPaidFixed} other)
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.8rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
                <div style={{ textAlign: 'right' }}>
                  {stat.balance > 0 ? (
                    <span style={{ color: 'var(--primary)', background: 'rgba(12, 173, 121, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                      Receivable: ৳ {stat.balance.toFixed(2)}
                    </span>
                  ) : stat.balance < 0 ? (
                    <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                      Payable: ৳ {Math.abs(stat.balance).toFixed(2)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Clear</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/meals/add')} className="btn btn-primary quick-action-btn" style={{ padding: '0.8rem 1.5rem' }}>
          <PlusCircle size={16} style={{ marginRight: '0.3rem' }} /> Add Meal
        </button>
        <button onClick={() => router.push('/dashboard/bazar/add')} className="btn btn-outline quick-action-btn" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '2px solid #ffffff', fontWeight: 600 }}>
          <ShoppingCart size={16} style={{ marginRight: '0.3rem' }} /> Add Bazar
        </button>
        <button onClick={() => router.push('/dashboard/other-expenses/add')} className="btn btn-outline quick-action-btn" style={{ padding: '0.8rem 1.5rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '2px solid #ffffff', fontWeight: 600 }}>
          <FileText size={16} style={{ marginRight: '0.3rem' }} /> Add Other Exp.
        </button>
      </div>

    </div>
  )
}
