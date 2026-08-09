'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SessionService } from '@/services/session.service'

interface SessionContextProps {
  sessions: any[]
  selectedSession: any
  currentActiveSession: any
  isLoading: boolean
  changeSession: (sessionId: string) => void
  clearSession: () => void
  reloadSessions: () => Promise<void>
}

const SessionContext = createContext<SessionContextProps | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [currentActiveSession, setCurrentActiveSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const allSessions = await SessionService.getAllSessions()
      setSessions(allSessions)
      
      const active = allSessions.find(s => s.status === 'open') || allSessions[0] || null
      setCurrentActiveSession(active)

      // Only set selected session if it hasn't been explicitly selected by user yet
      // Or if the currently selected one doesn't exist anymore
      setSelectedSession((prev: any) => {
        if (!prev) return active
        const exists = allSessions.find(s => s.id === prev.id)
        return exists ? exists : active
      })
    } catch (error) {
      console.error("Failed to load sessions for context:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const changeSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setSelectedSession(session)
    }
  }

  const clearSession = () => {
    setSelectedSession(currentActiveSession)
  }

  const reloadSessions = async () => {
    await loadSessions()
  }

  return (
    <SessionContext.Provider value={{
      sessions,
      selectedSession,
      currentActiveSession,
      isLoading,
      changeSession,
      clearSession,
      reloadSessions
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider')
  }
  return context
}
