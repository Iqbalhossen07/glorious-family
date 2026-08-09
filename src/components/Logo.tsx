import { Users } from 'lucide-react'

export default function Logo({ color = '#0CAD79', white = false, size = 'md', stacked = false }) {
  const iconSize = size === 'lg' ? 48 : size === 'md' ? 32 : 24;
  const textSize = size === 'lg' ? '2.2rem' : size === 'md' ? '1.5rem' : '1.2rem';
  const textColor = white ? '#ffffff' : '#0f172a';
  const iconCol = white ? '#ffffff' : color;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: stacked ? 'column' : 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: stacked ? '0.75rem' : '1rem' 
    }}>
      <div className="icon-floating" style={{ padding: size === 'lg' ? '0.75rem' : '0.5rem', borderRadius: '12px' }}>
        <Users size={iconSize} color={iconCol} strokeWidth={2.5} />
      </div>
      <span style={{ fontSize: textSize, fontWeight: 700, color: textColor, letterSpacing: '-0.02em', fontFamily: 'Merriweather, serif' }}>
        Glorious Family
      </span>
    </div>
  )
}
