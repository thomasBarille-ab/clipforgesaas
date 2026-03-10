import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-1px',
          }}
        >
          CC
        </span>
      </div>
    ),
    { ...size }
  )
}
