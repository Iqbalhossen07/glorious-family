import React from 'react';

const TECH_STACK = [
  "Docker",      // 12
  "React",       // 1
  "TypeScript",  // 2
  "Node",        // 3
  "Next",        // 4
  "Nest",        // 5
  "MongoDB",     // 6
  "MySQL",       // 7
  "PostgreSQL",  // 8
  "LLM",         // 9
  "RAG",         // 10
  "LangChain"    // 11
];

export default function DevClock({ time, size = 160 }: { time: Date, size?: number }) {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDegrees = (seconds / 60) * 360;
  const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
  const hourDegrees = ((hours % 12 + minutes / 60) / 12) * 360;

  const primaryColor = '#0cad79';
  const bgColor = '#ffffff';
  const darkBg = '#1e293b';

  return (
    <div 
      className="dev-clock-container"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: darkBg,
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 0 12px rgba(0,0,0,0.4)',
        border: `4px solid ${primaryColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: '"Fira Code", "JetBrains Mono", monospace'
      }}
    >
      {/* Clock Markers */}
      {Array.from({ length: 60 }).map((_, i) => {
        const isHour = i % 5 === 0;
        const rotation = i * 6;
        if (isHour) return null; // We use text for hours
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '1px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              top: 6,
              left: '50%',
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transformOrigin: `50% ${size / 2 - 6}px`,
              borderRadius: '1px'
            }}
          />
        );
      })}

      {/* Tech Stack Labels */}
      {TECH_STACK.map((tech, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = size / 2 - (size * 0.18);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        const colors = [
          '#38bdf8', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', 
          '#2dd4bf', '#fb923c', '#818cf8', '#34d399', '#fbb117', '#60a5fa', primaryColor
        ];
        
        return (
          <div
            key={tech}
            style={{
              position: 'absolute',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              fontSize: size * 0.055,
              fontWeight: 700,
              color: colors[i % colors.length],
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              zIndex: 2,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.5px'
            }}
          >
            {tech}
          </div>
        );
      })}

      {/* Hands */}
      {/* Hour Hand */}
      <div
        style={{
          position: 'absolute',
          width: '4px',
          height: '25%',
          backgroundColor: '#e2e8f0',
          bottom: '50%',
          left: '50%',
          transform: `translateX(-50%) rotate(${hourDegrees}deg)`,
          transformOrigin: 'bottom center',
          borderRadius: '4px',
          zIndex: 3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
        }}
      />
      
      {/* Minute Hand */}
      <div
        style={{
          position: 'absolute',
          width: '3px',
          height: '35%',
          backgroundColor: '#94a3b8',
          bottom: '50%',
          left: '50%',
          transform: `translateX(-50%) rotate(${minuteDegrees}deg)`,
          transformOrigin: 'bottom center',
          borderRadius: '2px',
          zIndex: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      />
      
      {/* Second Hand */}
      <div
        style={{
          position: 'absolute',
          width: '2px',
          height: '42%',
          backgroundColor: primaryColor,
          bottom: '50%',
          left: '50%',
          transform: `translateX(-50%) rotate(${secondDegrees}deg)`,
          transformOrigin: 'bottom center',
          borderRadius: '1px',
          zIndex: 5,
          boxShadow: `0 0 6px ${primaryColor}`
        }}
      >
        <div style={{
          position: 'absolute',
          width: '2px',
          height: '15px',
          backgroundColor: primaryColor,
          top: '100%',
          left: 0
        }} />
      </div>
      
      {/* Center Dot */}
      <div
        style={{
          position: 'absolute',
          width: '10px',
          height: '10px',
          backgroundColor: primaryColor,
          borderRadius: '50%',
          zIndex: 6,
          boxShadow: `0 0 8px ${primaryColor}`
        }}
      />
    </div>
  );
}
