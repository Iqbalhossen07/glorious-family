'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Type, AlignLeft } from 'lucide-react'
import { MessInfoService } from '@/services/mess_info.service'
import Swal from 'sweetalert2'

export default function AddMessInfoPage() {
  const router = useRouter()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description) {
      Swal.fire('Error', 'Please fill all fields.', 'error')
      return
    }

    try {
      Swal.showLoading()
      const userId = localStorage.getItem('currentUser')
      if (!userId) {
        throw new Error('Please select a member profile first.')
      }
      await MessInfoService.addInfo(title, description, userId)
      await Swal.fire('Success!', 'Info added successfully.', 'success')
      router.push('/dashboard/mess-info')
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/dashboard/mess-info')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>Add Info Card</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pin important information</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(148, 163, 184, 0.05)' }}>
        
        <form onSubmit={handleSave}>
          <div className="input-group">
            <label className="input-label">Title (e.g. WiFi Password)</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '0 1rem' }}>
              <Type size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                className="input-field"
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                style={{ border: 'none', boxShadow: 'none' }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Description (Multiple lines allowed)</label>
            <div style={{ display: 'flex', alignItems: 'flex-start', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.6)', padding: '1rem' }}>
              <AlignLeft size={18} color="var(--text-muted)" style={{ marginTop: '0.2rem' }} />
              <textarea 
                className="input-field"
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed information here..."
                rows={5}
                style={{ border: 'none', boxShadow: 'none', resize: 'vertical' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary submit-btn" >
              <Save size={20} /> Save Info
            </button>
          </div>

        </form>

      </div>

    </div>
  )
}
