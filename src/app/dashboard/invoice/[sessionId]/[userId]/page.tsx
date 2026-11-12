'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, User } from 'lucide-react'
import { SessionService } from '@/services/session.service'
import { MemberService } from '@/services/member.service'
import { MealService } from '@/services/meal.service'
import { BazarService } from '@/services/bazar.service'
import { DepositService } from '@/services/deposit.service'
import { FixedExpenseService } from '@/services/fixed_expense.service'
import { SettlementService } from '@/services/settlement.service'
import { CircularSeal, PaidStamp } from '@/components/InvoiceSeals'

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const userId = params.userId as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [member, setMember] = useState<any>(null)
  const [settlement, setSettlement] = useState<any>(null)

  const [stats, setStats] = useState<any>(null)
  const [globalStats, setGlobalStats] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        const [
          sData, 
          members, 
          mealsData, 
          bazarData, 
          depositsData, 
          fixedData, 
          settlementsData
        ] = await Promise.all([
          SessionService.getSessionById(sessionId),
          MemberService.getAllMembers(),
          MealService.getMealHistory(sessionId),
          BazarService.getBazarHistory(sessionId),
          DepositService.getDepositHistory(sessionId),
          FixedExpenseService.getFixedExpenseHistory(sessionId),
          SettlementService.getSettlementsBySession(sessionId)
        ])

        setSession(sData)
        const currentMember = members.find(m => m.id === userId)
        setMember(currentMember)

        const currentSettlement = settlementsData.find(s => s.user_id === userId)
        setSettlement(currentSettlement)

        const allOtherExpenses = fixedData.filter(f => f.item_name !== 'Room Rent')
        const roomRentsData = fixedData.filter(f => f.item_name === 'Room Rent')

        const tMeals = mealsData.reduce((sum, m) => sum + Number(m.meal_count), 0)
        const tBazar = bazarData.reduce((sum, b) => sum + Number(b.amount), 0)
        const tFixed = allOtherExpenses.reduce((sum, f) => sum + Number(f.amount), 0)
        
        let relevantMembers = members.map(m => {
           const mMeals = mealsData.filter(d => d.user_id === m.id).reduce((sum, d) => sum + Number(d.meal_count), 0)
           const mDeposits = depositsData.filter(d => d.user_id === m.id).reduce((sum, d) => sum + Number(d.amount), 0)
           const mBazar = bazarData.filter(b => b.user_id === m.id).reduce((sum, b) => sum + Number(b.amount), 0)
           const mPaidFixed = allOtherExpenses.filter(f => f.user_id === m.id).reduce((sum, f) => sum + Number(f.amount), 0)
           const mRoomRent = roomRentsData.filter(f => f.user_id === m.id).reduce((sum, f) => sum + Number(f.amount), 0)
           return { ...m, hasActivity: mMeals > 0 || mDeposits !== 0 || mBazar > 0 || mPaidFixed > 0 || mRoomRent > 0 }
        })

        const sessionDate = new Date(sData?.start_date || new Date())
        const endOfMonth = new Date(sessionDate.getFullYear(), sessionDate.getMonth() + 1, 0, 23, 59, 59)

        if (sData?.status === 'closed') {
           relevantMembers = relevantMembers.filter(m => m.hasActivity)
        } else {
           relevantMembers = relevantMembers.filter(m => {
              if (m.hasActivity) return true
              if (m.status !== 'active') return false
              const memberCreatedDate = new Date(m.created_at)
              return memberCreatedDate <= endOfMonth
           })
        }
        
        const activeMembersCount = relevantMembers.length
        
        const mRate = tMeals > 0 ? (tBazar / tMeals) : 0
        const fixedCostPerMember = activeMembersCount > 0 ? (tFixed / activeMembersCount) : 0

        setGlobalStats({
          totalMeals: tMeals,
          totalBazar: tBazar,
          totalFixedCost: tFixed,
          mealRate: mRate,
          fixedCostPerMember: fixedCostPerMember
        })

        const memberMeals = mealsData.filter(m => m.user_id === userId).reduce((sum, m) => sum + Number(m.meal_count), 0)
        const memberDeposits = depositsData.filter(d => d.user_id === userId).reduce((sum, d) => sum + Number(d.amount), 0)
        const memberBazar = bazarData.filter(b => b.user_id === userId).reduce((sum, b) => sum + Number(b.amount), 0)
        const memberPaidFixed = allOtherExpenses.filter(f => f.user_id === userId).reduce((sum, f) => sum + Number(f.amount), 0)
        const memberRoomRent = roomRentsData.filter(f => f.user_id === userId).reduce((sum, f) => sum + Number(f.amount), 0)
        
        const isMemberRelevant = relevantMembers.some(m => m.id === userId)
        const effectiveFixedCost = isMemberRelevant ? fixedCostPerMember : 0

        const mealCost = memberMeals * mRate
        const totalCost = mealCost + effectiveFixedCost + memberRoomRent
        const totalPaid = memberDeposits + memberBazar + memberPaidFixed

        setStats({
          totalMeals: memberMeals,
          mealCost: mealCost,
          fixedCost: effectiveFixedCost,
          roomRent: memberRoomRent,
          totalCost: totalCost,
          cashDeposit: memberDeposits,
          bazarPaid: memberBazar,
          fixedPaid: memberPaidFixed,
          totalPaid: totalPaid,
          balance: totalPaid - totalCost
        })

      } catch (error) {
        console.error("Error loading invoice:", error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId && userId) {
      loadInvoiceData()
    }
  }, [sessionId, userId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#000' }}>Generating Invoice...</div>
  }

  if (!session || !member) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#000' }}>Invoice not found.</div>
  }

  const finalAmount = Number(settlement?.amount || Math.abs(stats.balance)).toFixed(2)
  const isDue = settlement?.type === 'receivable'
  const isZeroBalance = Math.abs(stats.balance) < 0.5 || Number(finalAmount) === 0
  const isCleared = settlement?.status === 'cleared' || isZeroBalance || stats.balance >= -0.01
  const settleType = isDue ? 'Due (Payable to Mess)' : 'Refund (Payable to Member)'



  const handleDownload = async () => {
    const element = document.getElementById('invoice-capture')
    if (!element) return
    
    try {
      setIsDownloading(true)
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Invoice_${member.name}_${session.session_name}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '1rem' }} className="invoice-container">
      
      {/* Controls */}
      <div className="hide-on-print" style={{ maxWidth: '800px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => router.push(`/dashboard/members/${userId}`)} className="btn hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <User size={16} /> Member Details
          </button>
          <button onClick={handleDownload} disabled={isDownloading} className="btn btn-primary submit-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', border: 'none', opacity: isDownloading ? 0.7 : 1 }}>
            <Download size={16} /> {isDownloading ? 'Downloading...' : 'Download Receipt'}
          </button>
        </div>
      </div>

      {/* A4 Invoice Paper */}
      <div id="invoice-capture" className="invoice-paper" style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        background: '#fff', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        color: '#000',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Watermark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: '8rem',
          fontWeight: 900,
          color: 'var(--primary)',
          opacity: 0.04,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none'
        }}>
          Glorious Family
        </div>

        {/* Top Header */}
        <div className="invoice-header">
          <div className="header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>Glorious Family</h2>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5' }}>
              Mess Management System<br />
              Generated on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="header-right">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#fff', letterSpacing: '1px' }}>INVOICE</h1>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', fontSize: '0.85rem' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'left' }}>
                <div style={{ marginBottom: '0.3rem' }}>Session:</div>
                <div>Status:</div>
              </div>
              <div style={{ fontWeight: 600, textAlign: 'right', color: '#fff' }}>
                <div style={{ marginBottom: '0.3rem' }}>{session.session_name}</div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    background: isCleared ? 'rgba(255,255,255,0.22)' : 'rgba(239,68,68,0.35)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.4)'
                  }}>
                    {isCleared ? '✓ Cleared' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses Section */}
        <div className="invoice-addresses">
          <div className="billed-to">
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.2rem' }}>Billed To:</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.2rem', color: '#000' }}>{member.name}</h3>
            <div style={{ fontSize: '0.85rem', color: '#000', lineHeight: '1.5' }}>
              Email: {member.email}<br/>
              Role: {member.role === 'manager' ? 'Manager' : 'Member'}
            </div>
          </div>
          <div className="mess-summary">
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.2rem' }}>Mess Summary:</div>
            <div style={{ fontSize: '0.85rem', color: '#000', lineHeight: '1.5' }}>
              Total Meals: {globalStats.totalMeals}<br/>
              Total Bazar: ৳ {Number(globalStats.totalBazar).toFixed(2)}<br/>
              Meal Rate: <strong>৳ {Number(globalStats.mealRate).toFixed(2)}</strong><br/>
              Shared Fixed Expense: <strong>৳ {Number(globalStats.fixedCostPerMember).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Invoice Table Wrapper (For scroll on mobile) */}
        <div className="table-responsive" style={{ padding: '0 2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '500px' }}>
            <thead>
              <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', width: '40px' }}>No.</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Quantity / Rate</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>1</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#000', fontWeight: 500 }}>Meal Cost</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>{stats.totalMeals} X ৳{Number(globalStats.mealRate).toFixed(2)}</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#000' }}>{Number(stats.mealCost).toFixed(2)}</td>
              </tr>
              
              <tr style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>2</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#000', fontWeight: 500 }}>Shared Fixed Expense</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>Per Person</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#000' }}>{Number(stats.fixedCost).toFixed(2)}</td>
              </tr>
              
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>3</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#000', fontWeight: 500 }}>Room Rent</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>Personal</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#000' }}>{Number(stats.roomRent || 0).toFixed(2)}</td>
              </tr>
              
              <tr style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>4</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#000', fontWeight: 500 }}>Cash Deposits (Negative)</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>Given to Manager</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#ef4444' }}>-{Number(stats.cashDeposit).toFixed(2)}</td>
              </tr>
              
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>5</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#000', fontWeight: 500 }}>Bazar Paid by Member</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>Out-of-pocket</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#ef4444' }}>-{Number(stats.bazarPaid).toFixed(2)}</td>
              </tr>
              
              <tr style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>6</td>
                <td style={{ padding: '0.8rem 0.5rem', color: '#000', fontWeight: 500 }}>Fixed Expenses Paid</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: '#000' }}>Out-of-pocket</td>
                <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right', color: '#ef4444' }}>-{Number(stats.fixedPaid).toFixed(2)}</td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Invoice Bottom Section: Seals + Totals */}
        <div className="invoice-bottom-section" style={{ padding: '1.5rem 2rem 0' }}>
          {/* Left: Official Seals & Manager Signature */}
          <div className="seals-container">
            <div className="seals-flex">
              {/* Circular Notary Seal with All Member Names + Manager */}
              <div className="seal-item">
                <CircularSeal size={180} isCleared={isCleared} sessionName={session.session_name} />
              </div>

              {/* Slanted Official PAID Rubber Stamp */}
              {isCleared && (
                <div className="seal-item paid-stamp-item">
                  <PaidStamp width={145} height={75} />
                </div>
              )}
            </div>

            {/* Manager Authorization Signature Line */}
            <div className="manager-sign-block">
              <div className="manager-sign-name">
                Md. Iqbal Hossen
              </div>
              <div className="manager-sign-title">
                Authorized Signatory
              </div>
              <div className="manager-sign-role">
                Manager • Glorious Family
              </div>
            </div>
          </div>

          {/* Right: Totals Breakdown Table */}
          <div className="totals-block">
            <table style={{ width: '100%', fontSize: '0.9rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: '#475569', fontWeight: 500 }}>Total Expense</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700, width: '120px' }}>৳ {Number(stats.totalCost).toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: '#475569', fontWeight: 500 }}>Total Paid</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>৳ {Number(stats.totalPaid).toFixed(2)}</td>
                </tr>
                {isCleared ? (
                  <>
                    {Number(finalAmount) > 0 && (
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                          {isDue ? 'Settled (Paid by Member)' : 'Settled (Refunded)'}
                        </td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>৳ {finalAmount}</td>
                      </tr>
                    )}
                    <tr style={{ background: 'rgba(12, 173, 121, 0.12)' }}>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#047857', fontWeight: 800, fontSize: '1.05rem' }}>All Dues Cleared</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#047857', fontWeight: 800, fontSize: '1.05rem' }}>৳ 0.00</td>
                    </tr>
                  </>
                ) : (
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#ef4444', fontWeight: 800, fontSize: '1.05rem' }}>{settleType}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#ef4444', fontWeight: 800, fontSize: '1.05rem' }}>৳ {finalAmount}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ background: '#f8fafc', padding: '1rem 2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#000', marginTop: '2.5rem' }}>
          <div>Thank you for using Glorious Family.</div>
          <div>Developed by Iqbal Hossen &copy; 2026</div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .invoice-header {
          background: var(--primary);
          color: #fff;
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .invoice-addresses {
          display: flex;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          gap: 2rem;
        }
        .billed-to, .mess-summary {
          flex: 1;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .invoice-bottom-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .seals-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
          min-width: 280px;
        }
        .seals-flex {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .seal-item {
          flex-shrink: 0;
        }
        .manager-sign-block {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1.5px dashed #94a3b8;
          width: 200px;
          text-align: center;
        }
        .manager-sign-name {
          font-family: 'Segoe Script', 'Brush Script MT', cursive, sans-serif;
          font-size: 1.25rem;
          color: #0f172a;
          font-weight: 700;
          line-height: 1.1;
        }
        .manager-sign-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--primary);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .manager-sign-role {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 600;
        }
        .totals-block {
          width: 340px;
          flex-shrink: 0;
          margin-left: auto;
        }

        /* Mobile Responsiveness */
        @media (max-width: 650px) {
          .invoice-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
            padding: 1.5rem;
          }
          .header-right {
            text-align: left !important;
            width: 100%;
          }
          .header-right h1 {
            text-align: left;
          }
          .header-right > div {
            justify-content: flex-start !important;
          }
          .invoice-addresses {
            flex-direction: column;
            padding: 1.5rem;
            gap: 1.5rem;
          }
          .table-responsive {
            padding: 0 1rem !important;
          }
          .invoice-bottom-section {
            padding: 1.5rem 1rem 0 !important;
            flex-direction: column-reverse;
            align-items: center;
            gap: 2rem;
          }
          .seals-container {
            align-items: center;
            text-align: center;
            width: 100%;
          }
          .seals-flex {
            justify-content: center;
          }
          .manager-sign-block {
            margin: 0.5rem auto 0;
          }
          .totals-block {
            width: 100%;
            margin-left: 0;
          }
        }

        /* Print Responsiveness */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .invoice-paper, .invoice-paper * {
            visibility: visible;
          }
          .invoice-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-inside: avoid;
            page-break-after: avoid;
            overflow: hidden !important;
          }
          .hide-on-print {
            display: none !important;
          }
          .invoice-container {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
            height: auto !important;
          }
          .invoice-header {
            flex-direction: row;
            align-items: center;
          }
          .invoice-addresses {
            flex-direction: row;
          }
          .invoice-bottom-section {
            flex-direction: row !important;
            align-items: flex-end !important;
            page-break-inside: avoid;
          }
          .totals-block {
            width: 320px !important;
          }
        }
      `}} />
    </div>
  )
}
