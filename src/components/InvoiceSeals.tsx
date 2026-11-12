'use client'
import React from 'react'

interface CircularSealProps {
  size?: number
  sessionName?: string
  isCleared?: boolean
}

export function CircularSeal({ size = 180, sessionName, isCleared = true }: CircularSealProps) {
  const sealColor = isCleared ? '#1e40af' : '#b45309'
  const topText = '★ GLORIOUS FAMILY ★'
  const bottomText = 'IQBAL • ANTAR • ALAM • JAMAN • ANAMUL'

  const topChars = topText.split('')
  const topSpan = 110 // degrees
  const topStep = topSpan / (topChars.length - 1)

  const bottomChars = bottomText.split('')
  const bottomSpan = 145 // degrees
  const bottomStep = bottomSpan / (bottomChars.length - 1)

  const radius = (size / 2) - 22 // Distance from center to text baseline

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '50%',
        color: sealColor,
        fontFamily: 'Arial, Helvetica, sans-serif',
        userSelect: 'none',
        flexShrink: 0,
        transform: 'rotate(-3deg)',
        boxSizing: 'border-box'
      }}
    >
      {/* Outer Solid Ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `3.5px solid ${sealColor}`,
          boxSizing: 'border-box'
        }}
      />

      {/* Second Dashed Ring (Notary Style) */}
      <div
        style={{
          position: 'absolute',
          inset: '5px',
          borderRadius: '50%',
          border: `1.5px dashed ${sealColor}`,
          boxSizing: 'border-box'
        }}
      />

      {/* Inner Enclosing Ring */}
      <div
        style={{
          position: 'absolute',
          inset: '34px',
          borderRadius: '50%',
          border: `1.5px solid ${sealColor}`,
          boxSizing: 'border-box'
        }}
      />

      {/* Innermost Dotted Ring */}
      <div
        style={{
          position: 'absolute',
          inset: '38px',
          borderRadius: '50%',
          border: `1px dotted ${sealColor}`,
          boxSizing: 'border-box'
        }}
      />

      {/* Top Arc Text: GLORIOUS FAMILY */}
      {topChars.map((char, i) => {
        const angle = -(topSpan / 2) + i * topStep
        return (
          <span
            key={`top-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
              transformOrigin: 'center center',
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '1px',
              color: sealColor,
              whiteSpace: 'pre'
            }}
          >
            {char}
          </span>
        )
      })}

      {/* Bottom Arc Text: All 5 Members + Manager */}
      {bottomChars.map((char, i) => {
        const angle = -(bottomSpan / 2) + i * bottomStep
        const rad = (angle * Math.PI) / 180
        const x = (radius + 2) * Math.sin(rad)
        const y = (radius + 2) * Math.cos(rad)
        return (
          <span
            key={`bot-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(-angle).toFixed(2)}deg)`,
              transformOrigin: 'center center',
              fontSize: '7.5px',
              fontWeight: 800,
              letterSpacing: '0.3px',
              color: sealColor,
              whiteSpace: 'pre',
              lineHeight: 1
            }}
          >
            {char}
          </span>
        )
      })}

      {/* Center Content */}
      <div
        style={{
          position: 'absolute',
          inset: '42px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 2
        }}
      >
        {/* Stars */}
        <div style={{ fontSize: '10px', letterSpacing: '2px', lineHeight: 1, marginBottom: '2px', color: sealColor }}>
          ★★★
        </div>

        {/* Dynamic Status Text */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '1.5px',
            lineHeight: 1.1,
            color: sealColor,
            textTransform: 'uppercase'
          }}
        >
          {isCleared ? 'PAYMENT' : 'OFFICIAL'}
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '1.5px',
            lineHeight: 1.1,
            color: sealColor,
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}
        >
          {isCleared ? 'CLEARED' : 'PENDING'}
        </div>

        {/* Manager Ribbon Badge */}
        <div
          style={{
            background: sealColor,
            color: '#ffffff',
            fontSize: '7px',
            fontWeight: 800,
            letterSpacing: '0.8px',
            padding: '1.5px 6px',
            borderRadius: '3px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
        >
          MANAGER: IQBAL
        </div>

        {/* Sub-label */}
        <div
          style={{
            fontSize: '6.5px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: sealColor,
            marginTop: '3px',
            textTransform: 'uppercase'
          }}
        >
          OFFICIAL VERIFIED
        </div>
      </div>
    </div>
  )
}

interface PaidStampProps {
  width?: number
  height?: number
  date?: string
}

export function PaidStamp({ width = 150, height = 75, date }: PaidStampProps) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '8px',
        border: '3.5px solid #dc2626',
        padding: '3px',
        boxSizing: 'border-box',
        transform: 'rotate(-12deg)',
        color: '#dc2626',
        fontFamily: 'Arial, Helvetica, sans-serif',
        userSelect: 'none',
        flexShrink: 0,
        background: 'rgba(220, 38, 38, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Inner Fine Border */}
      <div
        style={{
          width: '100%',
          height: '100%',
          border: '1.5px solid rgba(220, 38, 38, 0.7)',
          borderRadius: '4px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 6px'
        }}
      >
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginBottom: '2px'
          }}
        >
          ★ GLORIOUS FAMILY ★
        </div>

        <div
          style={{
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '4px',
            lineHeight: 1,
            textTransform: 'uppercase',
            fontFamily: 'Impact, Arial Black, sans-serif',
            margin: '1px 0'
          }}
        >
          PAID
        </div>

        <div
          style={{
            fontSize: '7.5px',
            fontWeight: 800,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginTop: '2px'
          }}
        >
          OFFICIALLY SETTLED
        </div>
      </div>
    </div>
  )
}
