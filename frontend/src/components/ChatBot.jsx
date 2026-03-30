/**
 * components/ChatBot.jsx — AutoFix AI Buddy
 * A floating, conversational chatbot that helps students report issues.
 * Features: auto-fills submission form, mobile-friendly, always visible.
 */
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/chatbot/message'

function sendMessage(message, state) {
  return axios.post(API, { message, state })
}

const INITIAL_MESSAGES = [
  {
    from: 'bot',
    text: "👋 Hi! I'm **AutoFix AI Buddy**!\n\nTell me what's wrong on campus and I'll help you file a report instantly.",
  },
]

function renderText(text) {
  // Bold **text** support
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

export default function ChatBot({ onPrefill }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [botState, setBotState] = useState({})
  const [hasNew, setHasNew] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setHasNew(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { from: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await sendMessage(text, botState)
      const { reply, state, ready, prefill } = res.data
      setBotState(state)
      setMessages(m => [...m, { from: 'bot', text: reply }])
      if (ready && prefill && onPrefill) {
        onPrefill(prefill)
        setTimeout(() => setOpen(false), 1200)
      }
    } catch {
      setMessages(m => [...m, {
        from: 'bot',
        text: "⚠️ I'm having trouble connecting. Please try the form directly!"
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const quickReplies = ['Yes', 'No', 'Engineering Block', 'Library', 'Start over']

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #ed8936, #dd6b20)',
          boxShadow: '0 8px 32px rgba(237,137,54,0.5)',
        }}
        title="AutoFix AI Buddy"
      >
        <span className="text-2xl">{open ? '✕' : '🤖'}</span>
        {hasNew && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white" />
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          id="chatbot-window"
          className="fixed bottom-24 right-6 z-[9998] w-[350px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col"
          style={{
            height: '480px',
            background: 'white',
            border: '1px solid rgba(237,137,54,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(237,137,54,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a365d, #2D476F)' }}
          >
            <div className="w-9 h-9 rounded-full bg-orange-400/20 flex items-center justify-center text-xl border border-orange-300/30">
              🤖
            </div>
            <div>
              <div className="font-bold text-white text-[14px]">AutoFix AI Buddy</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-[11px] font-medium">Online · Ready to help</span>
              </div>
            </div>
            <button
              onClick={() => { setMessages(INITIAL_MESSAGES); setBotState({}) }}
              className="ml-auto text-white/50 hover:text-white/90 text-[11px] font-medium px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#f8fafc]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-sm mr-2 mt-1 shrink-0 border border-orange-200">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${
                    msg.from === 'user'
                      ? 'bg-gradient-to-br from-[#ed8936] to-[#dd6b20] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-sm mr-2 mt-1 shrink-0">🤖</div>
                <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-3 pt-2 pb-1 flex gap-1.5 flex-wrap bg-white border-t border-gray-100">
            {quickReplies.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100 transition-colors cursor-pointer">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 resize-none text-[13.5px] px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 bg-gray-50 placeholder-gray-400 transition-all"
              placeholder="Describe the problem..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ed8936, #dd6b20)' }}
            >
              <span className="text-white text-base">➤</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
