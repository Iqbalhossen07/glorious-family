'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, PlusCircle, Edit, Trash2, Info } from 'lucide-react'
import { MessInfoService } from '@/services/mess_info.service'
import { MemberService } from '@/services/member.service'
import Swal from 'sweetalert2'

export default function MessInfoPage() {
  const router = useRouter()
  const [infos, setInfos] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [data, membersData] = await Promise.all([
        MessInfoService.getAllInfo(),
        MemberService.getAllMembers()
      ])
      setInfos(data)
      setMembers(membersData)
    } catch (error) {
      console.error("Error loading mess info:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        Swal.showLoading()
        await MessInfoService.deleteInfo(id)
        await loadData() // refresh
        Swal.fire('Deleted!', 'The info has been deleted.', 'success')
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error')
      }
    }
  }

  const handleView = (info: any) => {
    let addedBy = 'System'
    const member = members.find(m => m.id === info.user_id)
    if (member) {
      addedBy = `${member.name} (${member.email})`
    }
    
    const formatTimeBD = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-US', { 
        timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    }

    const addedTime = info.created_at ? formatTimeBD(info.created_at) : 'N/A'

    Swal.fire({
      html: `
        <div style="text-align: left; font-family: inherit; padding-top: 1rem;">
          <div style="background: rgba(12, 173, 121, 0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(12, 173, 121, 0.1); margin-bottom: 1.5rem; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">ADDED ON</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${addedTime}</p>
          </div>
          
          <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem; color: var(--primary); font-family: Merriweather, serif; text-align: center;">${info.title}</h3>
          
          <div style="background: rgba(255,255,255,0.5); padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); margin-bottom: 1.5rem;">
            <p style="margin: 0; color: var(--text-main); font-size: 1rem; white-space: pre-wrap; line-height: 1.6;">${info.description}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between;">
              <strong style="font-size: 0.8rem; color: var(--text-muted);">ADDED BY</strong>
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); text-align: right;">${addedBy}</span>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: 'var(--primary)',
      customClass: { popup: 'glass-modal' }
    })
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading notice board...</div>
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Notice Board
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Important contacts and mess rules</p>
        </div>
        <button onClick={() => router.push('/dashboard/mess-info/add')} className="btn btn-primary quick-action-btn" style={{ padding: '0.7rem 1.2rem' }}>
          <PlusCircle size={16} style={{ marginRight: '0.4rem' }} /> Add Info
        </button>
      </div>

      {infos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
          <ClipboardList size={48} color="var(--border-light)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No information added yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Add WiFi passwords, cook numbers, or mess rules here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {infos.map((info) => (
            <div key={info.id} style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{info.title}</h3>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <button onClick={() => handleView(info)} className="action-btn action-btn-view" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    View
                  </button>
                  <button onClick={() => router.push(`/dashboard/mess-info/edit/${info.id}`)} className="action-btn action-btn-edit" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(info.id)} className="action-btn action-btn-delete" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', flexGrow: 1, lineHeight: '1.6', marginTop: '0.5rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {info.description}
              </div>
              {(() => {
                const member = members.find(m => m.id === info.user_id)
                return member ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.8rem', marginTop: 'auto' }}>
                    Added by: {member.name}
                  </div>
                ) : null
              })()}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
