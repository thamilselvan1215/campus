/**
 * pages/StudentPanel.jsx — Complaint submission, tracking, history, rating, and campus notice board.
 */
import { useState, useEffect, useRef } from 'react'
import { submitComplaint, listComplaints, getTodayEvent, rateComplaint } from '../api'
import StatusBadge from '../components/StatusBadge'
import StarRating from '../components/StarRating'

const LOCATIONS = [
  'Engineering Block', 'Science Block', 'Admin Block', 'Library',
  'Residence A', 'Residence B', 'Cafeteria', 'Sports Complex', 'Main Gate', 'Lecture Hall A',
]
const PRIORITY_COLORS = {
  Low: 'text-gray-500', Medium: 'text-amber-500',
  High: 'text-orange-500', Critical: 'text-red-500 font-bold'
}
const ICONS = {
  'Electrical': '⚡', 'Plumbing': '🔧', 'Internet / IT': '💻',
  'Cleaning': '🧹', 'HVAC / AC': '❄️', 'Security': '🔒',
  'Structural': '🏗️', 'Pest Control': '🐛',
}

export default function StudentPanel() {
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
    const interval = setInterval(fetchComplaints, 8000)
    return () => clearInterval(interval)
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

function ComplaintRow({ c, onRate, ratingState }) {
  const rs = ratingState[c.id]
  return (
    <div className="bg-white hover:bg-[#f8fafc] transition-colors border border-[var(--border)] rounded-xl py-4 px-6 flex items-center gap-5 flex-wrap shadow-sm hover:shadow-md group">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl border border-gray-100">
        {ICONS[c.issue_type] || '❓'}
      </div>
      <div className="flex-1 min-w-[200px]">
        <div className="font-bold text-[15px] text-[var(--primary-deep)] mb-1">#{c.id} — {c.issue_type || 'Classifying...'}</div>
        <div className="text-[var(--text-muted)] text-[13px] mb-1 flex items-center gap-2">
          <span>📍 {c.location}</span>
          {c.is_anonymous && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">🔒 Anon</span>}
        </div>
        <div className="text-gray-500 text-[13px] max-w-[500px] truncate">{c.description}</div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[11px] uppercase tracking-wider ${PRIORITY_COLORS[c.priority] || 'text-gray-500'}`}>{c.priority}</span>
          <StatusBadge status={c.status} />
        </div>
        {c.status === 'Resolved' && !c.student_rating && !rs?.done && (
          <div className="text-[12px] text-gray-500">
            <p className="font-semibold mb-1">Rate this resolution:</p>
            <StarRating size="sm" value={rs?.rating || 0} onChange={(r) => onRate(c.id, r)} />
          </div>
        )}
        {(c.student_rating || rs?.done) && (
          <StarRating size="sm" value={c.student_rating || rs?.rating || 0} readonly />
        )}
      </div>
    </div>
  )
}

function ComplaintDetailCard({ c, onRate, ratingState }) {
  const rs = ratingState[c.id]
  return (
    <div className="bg-white rounded-xl p-6 border border-[var(--border)] shadow-sm animate-fade-in">
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-100 pb-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-3xl border border-blue-100">
            {ICONS[c.issue_type] || '❓'}
          </div>
          <div>
            <div className="font-bold text-xl text-[var(--primary-deep)] mb-1">{c.issue_type || 'Classifying...'}</div>
            <div className="text-[var(--text-muted)] text-[13px]">📍 {c.location} · {new Date(c.submitted_at).toLocaleString()}</div>
            {c.is_anonymous && <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">🔒 Anonymous</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {c.status === 'In Progress' && (
            <span className="flex items-center gap-2 text-[12px] text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 animate-pulse">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />Being worked on
            </span>
          )}
          <StatusBadge status={c.status} />
        </div>
      </div>

      <p className="text-[var(--text-main)] text-[15px] my-4 leading-relaxed bg-[var(--bg-primary)] p-4 rounded-lg border border-gray-100">
        {c.description}
      </p>

      <div className="flex gap-x-8 gap-y-4 flex-wrap text-[14px] bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)]">Priority:</span>
          <strong className={PRIORITY_COLORS[c.priority]}>{c.priority}</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)]">AI Confidence:</span>
          <strong className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{Math.round(c.ai_confidence * 100)}%</strong>
        </div>
        {c.assigned_staff && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Assigned to:</span>
            <strong className="text-blue-600">{c.assigned_staff.name} ({c.assigned_staff.role})</strong>
          </div>
        )}
        {c.escalation_count > 0 && (
          <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs font-bold">⚠️ Escalated {c.escalation_count}×</span>
        )}
      </div>

      {c.ai_reasoning && (
        <div className="mb-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[14px] flex gap-3">
          <div className="text-xl mt-0.5">🤖</div>
          <div>
            <div className="font-bold text-indigo-900 mb-1 text-[12px] uppercase tracking-wider font-heading">AI Reasoning</div>
            <div className="text-indigo-800 leading-relaxed">{c.ai_reasoning}</div>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="mt-8 mb-6 relative px-2">
        <div className="absolute top-4 left-6 right-6 h-1 bg-gray-100 rounded-full z-0" />
        <div className="relative z-10 flex justify-between">
          {['Pending', 'Assigned', 'In Progress', 'Resolved'].map((step, i) => {
            const steps = ['Pending', 'Assigned', 'In Progress', 'Resolved']
            const currentIndex = c.status === 'Escalated' ? 1 : steps.indexOf(c.status)
            const isCompleted = i <= currentIndex
            const isCurrent = i === currentIndex
            return (
              <div key={step} className="flex flex-col items-center gap-2 w-16">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 z-10
                  ${isCompleted ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md shadow-orange-500/30' : 'bg-white border-gray-200 text-gray-400'}
                  ${isCurrent ? 'ring-4 ring-orange-100 scale-110' : ''}`}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-bold tracking-wide uppercase text-center ${isCurrent ? 'text-[var(--accent)]' : (isCompleted ? 'text-gray-700' : 'text-gray-400')}`}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resolution Summary */}
      {c.resolution_summary && (
        <div className="mb-4 p-4 rounded-xl bg-green-50/80 border border-green-200 text-[14px]">
          <div className="font-bold text-green-800 mb-1 text-[12px] uppercase tracking-wider">📋 AI Resolution Summary</div>
          <p className="text-green-700 m-0 leading-relaxed">{c.resolution_summary}</p>
        </div>
      )}

      {c.verification_note && (
        <div className={`mt-4 p-4 rounded-lg text-[14px] border ${c.verification_status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <div className="font-bold mb-1">{c.verification_status === 'verified' ? '✅ Resolution Approved' : '❌ Resolution Rejected'}</div>
          <div>AI Note: {c.verification_note}</div>
        </div>
      )}

      {/* Rating */}
      {c.status === 'Resolved' && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
          <p className="font-bold text-[14px] text-amber-800 mb-3">How was the resolution?</p>
          {c.student_rating || rs?.done ? (
            <div>
              <StarRating value={c.student_rating || rs?.rating || 0} readonly />
              <p className="text-sm text-green-600 font-semibold mt-2">✅ Thank you for your feedback!</p>
            </div>
          ) : (
            <StarRating value={rs?.rating || 0} onChange={(r) => onRate(c.id, r)} />
          )}
        </div>
      )}
    </div>
  )
}
