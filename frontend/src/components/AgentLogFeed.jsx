/**
 * components/AgentLogFeed.jsx — Real-time SSE terminal feed of agent decisions.
 * Connects to /logs/stream via EventSource and renders each log entry with colors.
 */
import { useEffect, useRef, useState } from 'react'

const AGENT_COLORS = {
  Coordinator:    { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-700/50' },
  ComplaintIntel: { bg: 'bg-blue-900/40',   text: 'text-blue-300',   border: 'border-blue-700/50' },
  Assignment:     { bg: 'bg-cyan-900/40',    text: 'text-cyan-300',   border: 'border-cyan-700/50' },
  Monitoring:     { bg: 'bg-yellow-900/40',  text: 'text-yellow-300', border: 'border-yellow-700/50' },
  Escalation:     { bg: 'bg-red-900/40',     text: 'text-red-300',    border: 'border-red-700/50' },
  Verification:   { bg: 'bg-green-900/40',   text: 'text-green-300',  border: 'border-green-700/50' },
}

const LEVEL_ICONS = {
  info:    '🔵',
  success: '✅',
  warning: '⚠️',
  error:   '🔴',
}

export default function AgentLogFeed() {
  const [entries, setEntries] = useState([])
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef(null)
  const esRef = useRef(null)

  useEffect(() => {
    // Load historic entries first
    fetch('http://localhost:8000/logs/all')
      .then(r => r.json())
      .then(data => setEntries(data))
      .catch(() => {})

    // Connect SSE
    const es = new EventSource('http://localhost:8000/logs/stream')
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      try {
        const entry = JSON.parse(e.data)
        setEntries(prev => [...prev.slice(-199), entry])
      } catch {}
    }
    es.onerror = () => setConnected(false)

    return () => { es.close(); setConnected(false) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400'}`} />
          <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
            {connected ? 'Live Feed — Connected' : 'Disconnected'}
          </span>
        </div>
        <span className="text-[11px] text-gray-600 font-mono">{entries.length} events</span>
      </div>

      {/* Log terminal */}
      <div className="flex-1 bg-[#0d1117] rounded-xl border border-gray-800 overflow-y-auto p-3 font-mono text-[12px] min-h-[400px] max-h-[600px]">
        {entries.length === 0 && (
          <div className="text-gray-600 text-center mt-16">
            <p className="text-2xl mb-2">⏳</p>
            <p>Waiting for agent activity...</p>
            <p className="text-[11px] mt-1">Submit a complaint or simulate chaos to see agents work.</p>
          </div>
        )}
        {entries.map((entry, i) => {
          const colors = AGENT_COLORS[entry.agent] || { bg: 'bg-gray-900', text: 'text-gray-400', border: 'border-gray-700' }
          const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          return (
            <div key={i} className={`flex gap-2 items-start mb-1.5 rounded-md px-2 py-1.5 border ${colors.bg} ${colors.border} animate-fade-in`}>
              <span className="text-gray-600 text-[10px] w-16 shrink-0 pt-0.5">{time}</span>
              <span className={`text-[10px] font-bold w-24 shrink-0 ${colors.text} uppercase tracking-wide pt-0.5`}>[{entry.agent}]</span>
              <span className="mr-1">{LEVEL_ICONS[entry.level] || '•'}</span>
              <span className="text-gray-300 leading-relaxed">{entry.message}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
