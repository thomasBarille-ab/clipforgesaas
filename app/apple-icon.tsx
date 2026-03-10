import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
        }}
      >
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
          <path d="M8 5v14l11-7z" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
