'use client'

import React from 'react'
import { useSessionContext } from '@/context/SessionContext'
import { Calendar, XCircle, Loader2 } from 'lucide-react'

export default function GlobalSessionSelector() {
  const { sessions, selectedSession, currentActiveSession, isLoading, changeSession, clearSession } = useSessionContext()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        <Loader2 size={16} className="spin" /> Loading session...
      </div>
    )
  }

  if (!selectedSession) {
    return null
  }

  const isViewingPastSession = currentActiveSession && selectedSession.id !== currentActiveSession.id

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--primary)', width: 'fit-content', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <Calendar size={18} color="var(--primary)" />
        <select 
          value={selectedSession.id}
          onChange={(e) => changeSession(e.target.value)}
          style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.session_name} {s.status === 'closed' ? '(Closed)' : ''}
            </option>
          ))}
        </select>
      </div>

      {isViewingPastSession && (
        <button 
          onClick={clearSession}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          <XCircle size={16} /> Back to Current Month
        </button>
      )}

      {selectedSession.status === 'closed' && (
        <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #fde68a' }}>
          Viewing Closed Session (Read-Only)
        </div>
      )}
    </div>
  )
}
