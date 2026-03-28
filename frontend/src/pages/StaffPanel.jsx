/**
 * pages/StaffPanel.jsx — Staff view: tasks, start/reject/verify, time log, points badge.
 */
import { useState, useEffect, useRef } from 'react'
import { listStaff, getStaffTasks, updateStatus, verifyComplaint, escalateComplaint, rejectComplaint } from '../api'
import StatusBadge from '../components/StatusBadge'

const ICONS = {
  'Electrical': '⚡', 'Plumbing': '🔧', 'Internet / IT': '💻',
  'Cleaning': '🧹', 'HVAC / AC': '❄️', 'Security': '🔒',
  'Structural': '🏗️', 'Pest Control': '🐛',
}
const PRIORITY_COLORS = { Low: 'text-gray-500', Medium: 'text-amber-500', High: 'text-orange-500', Critical: 'text-red-500' }

function useElapsedTime(startISO) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startISO) return
    const start = new Date(startISO).getTime()
    const update = () => {
      const diff = Math.floor((Date.now() - start) / 1000)
      const m = Math.floor(diff / 60)
      const s = diff % 60
      setElapsed(`${m}m ${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [startISO])
  return elapsed
}

function ElapsedBadge({ startISO }) {
  const elapsed = useElapsedTime(startISO)
  if (!elapsed) return null
  return (
    <div className="text-[12px] text-purple-600 font-bold flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full w-fit border border-purple-100">
      ⏱️ Working for {elapsed}
    </div>
  )
}

export default function StaffPanel() {
  const [staff, setStaff] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [actionState, setActionState] = useState({})
  const [proofFiles, setProofFiles] = useState({})
  const [verifyResult, setVerifyResult] = useState({})
  const [rejectModal, setRejectModal] = useState(null) // task id
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    listStaff().then(r => { setStaff(r.data); setLoadingStaff(false) })
  }, [])

  useEffect(() => {
    if (!selectedStaff) return
    fetchTasks()
    const i = setInterval(fetchTasks, 8000)
    return () => clearInterval(i)
  }, [selectedStaff])

  const fetchTasks = async () => {
    if (!selectedStaff) return
    setLoadingTasks(true)
    try { const res = await getStaffTasks(selectedStaff.id); setTasks(res.data) }
    catch (e) { console.error(e) }
    finally { setLoadingTasks(false) }
  }

  const handleStatusUpdate = async (taskId, newStatus) => {
    setActionState(s => ({ ...s, [taskId]: 'updating' }))
    try { await updateStatus(taskId, newStatus); fetchTasks() }
    catch (e) { alert('Failed: ' + e.message) }
    finally { setActionState(s => ({ ...s, [taskId]: null })) }
  }

  const handleVerify = async (taskId) => {
    const file = proofFiles[taskId]
    if (!file) return alert('Please select a proof image first.')
    setActionState(s => ({ ...s, [taskId]: 'verifying' }))
    try {
      const fd = new FormData()
      fd.append('proof', file)
      const res = await verifyComplaint(taskId, fd)
      setVerifyResult(r => ({ ...r, [taskId]: res.data }))
      fetchTasks()
    } catch (e) { alert('Verification failed: ' + e.message) }
    finally { setActionState(s => ({ ...s, [taskId]: null })) }
  }

  const handleEscalate = async (taskId) => {
    setActionState(s => ({ ...s, [taskId]: 'escalating' }))
    try { await escalateComplaint(taskId); fetchTasks() }
    catch (e) { alert('Error: ' + e.message) }
    finally { setActionState(s => ({ ...s, [taskId]: null })) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert('Please enter a reason.')
    setActionState(s => ({ ...s, [rejectModal]: 'rejecting' }))
    try {
      await rejectComplaint(rejectModal, rejectReason.trim())
      setRejectModal(null)
      setRejectReason('')
      fetchTasks()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setActionState(s => ({ ...s, [rejectModal]: null })) }
  }

  const currentStaffInfo = staff.find(s => s.id === selectedStaff?.id)

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold m-0 bg-gradient-to-br from-[var(--accent)] to-[#dd6b20] bg-clip-text text-transparent font-heading">
          👷 Staff Panel
        </h1>
        <p className="text-[var(--text-muted)] mt-1.5 text-[14px] font-medium">Select your profile to view assigned tasks.</p>
      </div>

      {/* Staff Selector */}
      <div className="card mb-6">
        <h2 className="m-0 mb-4 text-[13px] font-bold text-gray-500 uppercase tracking-widest font-heading">Select Staff Member</h2>
        {loadingStaff ? (
          <div className="spinner w-6 h-6 border-[3px] border-blue-500 border-t-transparent mx-auto block" />
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {staff.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStaff(s)}
                className={`px-4 py-3 rounded-xl cursor-pointer border text-left transition-all duration-200 min-w-[160px]
                  ${selectedStaff?.id === s.id
                    ? 'border-[var(--accent)] bg-orange-50 shadow-[0_2px_8px_rgba(237,137,54,0.15)] ring-2 ring-orange-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <div className={`font-bold text-[14px] ${selectedStaff?.id === s.id ? 'text-orange-700' : 'text-gray-800'}`}>{s.name}</div>
                <div className={`text-[11px] mt-0.5 ${selectedStaff?.id === s.id ? 'text-orange-600/80' : 'text-gray-500'}`}>
                  {s.role} · {s.building}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                    🏆 {s.points}pts
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.is_available ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {s.is_available ? '🟢' : '🔴'} {s.current_load} tasks
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      {selectedStaff && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-5 bg-[var(--bg-primary)] sticky top-16 py-2 z-10 border-b border-gray-100">
            <h2 className="m-0 text-[18px] font-bold font-heading text-[var(--text-main)] flex items-center gap-3">
              Tasks for {selectedStaff.name}
              {loadingTasks && <span className="spinner w-4 h-4 border-[2px] border-blue-500 border-t-transparent" />}
            </h2>
            <div className="flex items-center gap-3">
              {currentStaffInfo && (
                <span className="text-[13px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  🏆 {currentStaffInfo.points} pts
                </span>
              )}
              <span className="text-[13px] font-semibold text-[var(--accent)] bg-orange-50 px-3 py-1 rounded-full">
                {tasks.length} active task{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="card text-center py-16 border-dashed border-2 shadow-sm">
              <div className="text-5xl mb-4">✨</div>
              <p className="m-0 font-bold text-gray-700 text-lg">No active tasks</p>
              <p className="m-0 mt-2 text-[14px] text-gray-500 font-medium">All caught up for {selectedStaff.building}!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {tasks.map(task => (
                <div key={task.id} className="card animate-fade-in p-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Task header */}
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl border border-blue-100 shadow-sm">
                        {ICONS[task.issue_type] || '❓'}
                      </div>
                      <div>
                        <div className="font-bold text-[16px] text-[var(--primary-deep)]">#{task.id} — {task.issue_type}</div>
                        <div className="text-[var(--text-muted)] text-[12px] font-medium mt-0.5">📍 {task.location}</div>
                        {task.is_anonymous && (
                          <span className="text-[10px] mt-1 inline-block bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">🔒 Anonymous</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <p className="text-[var(--text-main)] text-[14px] leading-relaxed mb-4 bg-[#f8fafc] p-4 rounded-xl border border-gray-100">
                    {task.description}
                  </p>

                  {/* AI Reasoning */}
                  {task.ai_reasoning && (
                    <div className="mb-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[13px] flex gap-2">
                      <span>🤖</span>
                      <span className="text-indigo-700">{task.ai_reasoning}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    {task.sla_deadline && (
                      <div className="text-[12px] text-orange-600 font-bold flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                        ⏰ SLA: {new Date(task.sla_deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                    {task.status === 'In Progress' && task.work_started_at && (
                      <ElapsedBadge startISO={task.work_started_at} />
                    )}
                    {task.escalation_count > 0 && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                        ⚠️ Escalated {task.escalation_count}×
                      </span>
                    )}
                    {task.rejection_reason && (
                      <div className="text-[12px] text-gray-500 italic bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                        Prev rejection: "{task.rejection_reason}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(task.status === 'Assigned' || task.status === 'Escalated') && (
                    <div className="flex gap-3 flex-wrap mb-2 border-t border-gray-100 pt-5">
                      <button className="btn-primary"
                        onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                        disabled={actionState[task.id] === 'updating'}>
                        {actionState[task.id] === 'updating' ? <><span className="spinner w-4 h-4" />Starting...</> : '▶️ Start Work'}
                      </button>
                      <button className="btn-ghost border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => { setRejectModal(task.id); setRejectReason('') }}>
                        ❌ Reject Task
                      </button>
                      <button className="btn-danger"
                        onClick={() => handleEscalate(task.id)}
                        disabled={actionState[task.id] === 'escalating'}>
                        🚨 Escalate
                      </button>
                    </div>
                  )}

                  {/* Proof Upload */}
                  {(task.status === 'In Progress' || task.status === 'Assigned' || task.status === 'Escalated') && (
                    <div className="bg-[#f8fafc] border border-[var(--border)] rounded-xl p-5 mt-4">
                      <p className="m-0 mb-3 font-bold text-[13px] text-[var(--primary-deep)] uppercase tracking-wide font-heading">
                        📸 Upload Proof of Completion
                      </p>
                      <div className="flex gap-3 items-center flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                          <input type="file" accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={e => setProofFiles(f => ({ ...f, [task.id]: e.target.files[0] }))} />
                          <div className="input flex items-center justify-between pointer-events-none text-[13px] bg-white border-dashed shadow-sm">
                            <span className="truncate">{proofFiles[task.id] ? proofFiles[task.id].name : 'Select image...'}</span>
                            <span className="text-gray-400">📁</span>
                          </div>
                        </div>
                        <button className="btn-primary !bg-[var(--primary-deep)] hover:!bg-blue-900 shadow-md"
                          onClick={() => handleVerify(task.id)}
                          disabled={actionState[task.id] === 'verifying' || !proofFiles[task.id]}>
                          {actionState[task.id] === 'verifying'
                            ? <><span className="spinner w-4 h-4 border-white" />Verifying...</>
                            : '🤖 Submit for AI Verification'}
                        </button>
                      </div>
                      {verifyResult[task.id] && (
                        <div className={`mt-4 p-3 rounded-lg text-[13px] font-medium flex items-center gap-2 border shadow-sm
                          ${verifyResult[task.id].verification_status === 'verified'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <span>{verifyResult[task.id].verification_status === 'verified' ? '✅' : '❌'}</span>
                          <span>{verifyResult[task.id].verification_note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="font-bold text-[18px] text-gray-900 mb-2 font-heading">❌ Reject Task #{rejectModal}</h3>
            <p className="text-gray-600 text-sm mb-4">Provide a reason why you're rejecting this task. It will be re-queued for reassignment.</p>
            <textarea
              className="input mb-4"
              rows={3}
              placeholder="e.g. This is not an electrical problem — belongs to Plumbing team."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button className="btn-danger flex-1" onClick={handleReject}
                disabled={actionState[rejectModal] === 'rejecting'}>
                {actionState[rejectModal] === 'rejecting' ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button className="btn-ghost flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
