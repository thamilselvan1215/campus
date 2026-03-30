/**
 * pages/StudentPanel.jsx — Complaint submission, tracking, history, rating, and campus notice board.
 */
import { useState, useEffect, useRef } from 'react'
import { submitComplaint, listComplaints, getTodayEvent, rateComplaint } from '../api'
import StatusBadge from '../components/StatusBadge'
import StarRating from '../components/StarRating'
import ComplaintRow from '../components/ComplaintRow'
import ComplaintDetailCard from '../components/ComplaintDetailCard'
import { LOCATIONS, PRIORITY_COLORS, ICONS } from '../utils/constants'

export default function StudentPanel({ chatPrefill, onClearPrefill }) {
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(LOCATIONS[0])
  const [image, setImage] = useState(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('submit')
  const [trackId, setTrackId] = useState('')
  const [todayEvent, setTodayEvent] = useState(null)
  const [ratingState, setRatingState] = useState({}) // { [id]: {rating, submitting, done} }
  const fileRef = useRef()

  // Pre-fill location from QR code URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location')
    if (loc && LOCATIONS.includes(loc)) {
      setLocation(loc)
      setActiveTab('submit')
    }
  }, [])

  // 🤖 Auto-fill from AI Chatbot
  useEffect(() => {
    if (chatPrefill) {
      setDescription(chatPrefill.description || '')
      if (chatPrefill.location && LOCATIONS.includes(chatPrefill.location)) {
        setLocation(chatPrefill.location)
      }
      setActiveTab('submit')
      if (onClearPrefill) onClearPrefill()
    }
  }, [chatPrefill])

  const fetchComplaints = async () => {
    try { const res = await listComplaints(); setComplaints(res.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchEvent = async () => {
    try { const res = await getTodayEvent(); setTodayEvent(res.data) }
    catch { }
  }

  useEffect(() => {
    fetchComplaints()
    fetchEvent()
    
    const ws = new WebSocket('ws://localhost:8000/ws')
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'complaint_update' || msg.type === 'new_complaint') {
          fetchComplaints()
        }
      } catch (e) {}
    }
    
    return () => {
      if (ws.readyState === 1) ws.close()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('description', description)
      fd.append('location', location)
      fd.append('is_anonymous', isAnonymous)
      if (image) fd.append('image', image)
      const res = await submitComplaint(fd)
      setSubmitted(res.data)
      setDescription('')
      setImage(null)
      setIsAnonymous(false)
      if (fileRef.current) fileRef.current.value = ''
      fetchComplaints()
    } catch (e) {
      alert('Submission failed: ' + (e.response?.data?.detail || e.message))
    } finally { setSubmitting(false) }
  }

  const handleRate = async (complaintId, rating) => {
    setRatingState(r => ({ ...r, [complaintId]: { rating, submitting: true } }))
    try {
      await rateComplaint(complaintId, rating)
      setRatingState(r => ({ ...r, [complaintId]: { rating, submitting: false, done: true } }))
      fetchComplaints()
    } catch {
      setRatingState(r => ({ ...r, [complaintId]: { rating: 0, submitting: false } }))
    }
  }

  const trackedComplaint = complaints.find(c => c.id === parseInt(trackId))

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Hero */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[var(--primary-deep)] to-[#2D476F] shadow-lg text-white">
        <h1 className="text-3xl font-extrabold mb-2 font-heading tracking-tight text-white">🎓 Student Portal</h1>
        <p className="text-blue-100 text-[15px] opacity-90 max-w-xl">
          Submit a campus complaint in seconds. Our AI will classify, assign the right team, and track resolution in real-time.
        </p>
      </div>

      {/* AI Notice Board */}
      {todayEvent && (
        <div className="mb-8 p-[3px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-xl animate-fade-in">
          <div className="bg-white rounded-[14px] p-5 flex flex-col sm:flex-row gap-6 items-center">
            <div className="sm:w-1/3 w-full shrink-0">
              <img src={todayEvent.image_url} alt={todayEvent.event_name}
                className="w-full h-auto aspect-square object-cover rounded-xl shadow-md border border-gray-100 bg-gray-50" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 border border-indigo-100">
                🗓️ AutoFix Campus Notice Board
              </div>
              <h2 className="text-2xl font-extrabold text-[#2D476F] font-heading mb-1.5">{todayEvent.poster_title}</h2>
              <p className="text-gray-600 font-medium text-[15px] mb-4">"{todayEvent.tagline}"</p>
              <div className="text-sm text-gray-500 bg-[var(--bg-primary)] inline-block px-4 py-2 rounded-lg border border-[var(--border)]">
                🎨 <strong>Theme:</strong> {todayEvent.theme}
              </div>
              <div className="mt-5 flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
                <p className="text-[12px] text-purple-600 font-bold uppercase tracking-wide">Generated autonomously by AI</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-[var(--bg-card)] p-1.5 rounded-xl border border-[var(--border)] shadow-sm w-fit">
        {[['submit', '📝 Submit'], ['track', '🔍 Track'], ['history', '📋 History']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 rounded-lg cursor-pointer font-semibold text-[14px] transition-all duration-200 ${
              activeTab === key
                ? 'bg-gradient-to-r from-[var(--accent)] to-[#dd6b20] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
            }`}>{label}</button>
        ))}
      </div>

      {/* Submit Form */}
      {activeTab === 'submit' && (
        <div className="card animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--accent)] to-[#dd6b20]" />
          <h2 className="m-0 mb-6 text-xl font-bold font-heading">Report an Issue</h2>

          {submitted && (
            <div className="bg-green-50/80 border border-green-200 rounded-xl p-5 mb-6 animate-fade-in shadow-sm">
              <p className="m-0 text-green-700 font-bold text-[15px] flex items-center gap-2">
                <span className="bg-green-100 p-1 rounded-full">✅</span>
                Complaint #{submitted.id} submitted successfully!
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="bg-white border border-gray-100 px-3 py-1 rounded-md shadow-sm">
                  Category: <strong className="text-indigo-600">{submitted.issue_type}</strong>
                </span>
                <span className="bg-white border border-gray-100 px-3 py-1 rounded-md shadow-sm">
                  Priority: <strong className={PRIORITY_COLORS[submitted.priority]}>{submitted.priority}</strong>
                </span>
                <span className="bg-white border border-gray-100 px-3 py-1 rounded-md shadow-sm">
                  AI Confidence: <strong>{Math.round(submitted.ai_confidence * 100)}%</strong>
                </span>
                {submitted.sentiment_score > 0.3 && (
                  <span className="bg-orange-50 border border-orange-200 px-3 py-1 rounded-md shadow-sm text-orange-700 font-semibold">
                    ⚠️ High urgency detected
                  </span>
                )}
              </div>
              {submitted.ai_reasoning && (
                <div className="mt-4 bg-white/60 p-3 rounded-lg border border-green-100 text-[13px] text-green-800 flex gap-2">
                  <span>🤖</span> <em>"{submitted.ai_reasoning}"</em>
                </div>
              )}
              {submitted.assigned_staff && (
                <p className="mt-4 text-sm text-gray-600 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1 rounded-full text-xs">👷</span>
                  Assigned to: <strong className="text-blue-600">{submitted.assigned_staff.name}</strong> ({submitted.assigned_staff.role})
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block font-semibold text-[14px] text-[var(--text-muted)] mb-2">Describe the issue *</label>
              <textarea className="input focus:ring-2 focus:ring-[var(--accent)]/20" rows={4}
                placeholder="e.g. The lights in Lab 3B are flickering and one socket has no power..."
                value={description} onChange={e => setDescription(e.target.value)} required style={{ resize: 'vertical' }} />
            </div>

            <div className="flex gap-5 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[14px] text-[var(--text-muted)] mb-2">Location *</label>
                <select className="input cursor-pointer" value={location} onChange={e => setLocation(e.target.value)}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block font-semibold text-[14px] text-[var(--text-muted)] mb-2">Photo Proof (optional)</label>
                <div className="relative">
                  <input ref={fileRef} type="file" accept="image/*"
                    onChange={e => setImage(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="input flex items-center justify-between pointer-events-none text-gray-500 bg-gray-50 border-dashed">
                    <span className="truncate">{image ? image.name : 'Upload image (JPG, PNG)'}</span>
                    <span className="text-xl">📸</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isAnonymous ? 'bg-[var(--accent)]' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isAnonymous ? 'translate-x-5' : ''}`} />
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="sr-only" />
              </div>
              <span className="text-[14px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-main)]">
                Submit anonymously 🔒
              </span>
            </label>

            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 text-[14px] text-[var(--text-muted)]">
              🤖 <strong className="text-indigo-600">AI will automatically</strong> analyze your text to classify the issue, assign a staff member based on proximity, and track resolution.
            </div>

            <button type="submit" className="btn-primary self-start mt-2 px-6 py-3 text-[15px] !rounded-xl" disabled={submitting}>
              {submitting ? <><span className="spinner w-4 h-4" />Processing...</> : '🚀 Submit Complaint'}
            </button>
          </form>
        </div>
      )}

      {/* Track */}
      {activeTab === 'track' && (
        <div className="card animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]" />
          <h2 className="m-0 mb-6 text-xl font-bold font-heading">Track Your Complaint</h2>
          <div className="flex gap-3 mb-8">
            <input className="input max-w-[280px] shadow-sm" type="number" placeholder="Enter Complaint ID (e.g. 3)"
              value={trackId} onChange={e => setTrackId(e.target.value)} />
          </div>
          {trackId && !trackedComplaint && (
            <p className="text-[var(--text-muted)] bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
              No active complaint found with ID #{trackId}.
            </p>
          )}
          {trackedComplaint && (
            <ComplaintDetailCard c={trackedComplaint} onRate={handleRate} ratingState={ratingState} />
          )}
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="card animate-fade-in bg-transparent border-none shadow-none p-0">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="m-0 text-xl font-bold font-heading text-[var(--text-main)]">All Complaints</h2>
            <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
              {complaints.length} Total
            </span>
          </div>
          {loading ? (
            <div className="spinner mx-auto block mt-12" />
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[var(--border)] shadow-sm">
              <div className="text-4xl mb-4 opacity-50">📭</div>
              <p className="text-[var(--text-muted)] font-medium">No complaints submitted yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {complaints.map(c => (
                <ComplaintRow key={c.id} c={c} onRate={handleRate} ratingState={ratingState} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


