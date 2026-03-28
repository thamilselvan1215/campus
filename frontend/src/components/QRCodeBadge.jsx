/**
 * components/QRCodeBadge.jsx — Generates a QR code for a campus location.
 * Uses qrcode.js injected via CDN (no npm install).
 */
import { useEffect, useRef, useState } from 'react'

export default function QRCodeBadge({ location, baseUrl = 'http://localhost:5173' }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Dynamically load QRCode.js from CDN if not already loaded
    if (window.QRCode) {
      drawQR()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => { setReady(true); drawQR() }
    document.head.appendChild(script)
  }, [location])

  const drawQR = () => {
    if (!canvasRef.current || !window.QRCode) return
    canvasRef.current.innerHTML = ''
    const url = `${baseUrl}?location=${encodeURIComponent(location)}`
    new window.QRCode(canvasRef.current, {
      text: url,
      width: 140,
      height: 140,
      colorDark: '#1a365d',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H,
    })
  }

  useEffect(() => {
    if (ready) drawQR()
  }, [ready])

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div ref={canvasRef} className="rounded-lg overflow-hidden" />
      <span className="text-[12px] font-bold text-[#1a365d] text-center leading-tight">{location}</span>
      <span className="text-[10px] text-gray-400">Scan to report an issue</span>
    </div>
  )
}
