'use client'
import { BarChart3, Globe, ExternalLink, Activity, Users, MonitorSmartphone } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '5rem' }}>
      
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <Globe size={32} color="#3b82f6" />
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Web Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track visitors, locations, and devices</p>
        </div>
      </div>

      <div className="minimal-card" style={{ padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          width: '80px', height: '80px', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 1.5rem' 
        }}>
          <BarChart3 size={40} color="#3b82f6" />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Live Tracking is Active!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
          We have integrated <strong>Vercel Web Analytics</strong> into the application. To keep the app lightning fast, all tracking data (countries, cities like Dhaka, devices, and browsers) is processed and stored securely on Vercel's servers.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={24} color="#10b981" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Locations (Dhaka, etc.)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <MonitorSmartphone size={24} color="#f59e0b" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Devices & Browsers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} color="#ef4444" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Live Visitors</span>
          </div>
        </div>

        <a 
          href="https://vercel.com/dashboard" 
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1rem', background: '#000', color: '#fff', border: 'none' }}
        >
          View Full Analytics on Vercel <ExternalLink size={18} />
        </a>
      </div>

    </div>
  )
}
