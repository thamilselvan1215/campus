/**
 * pages/AdminDashboard.jsx — Admin view with live agent log, heatmap, charts,
 * SLA breach report, staff leaderboard, and QR codes.
 */
import { useState, useEffect } from 'react'
import {
  getDashboardStats, listComplaints, escalateComplaint, simulateChaos,
  getHeatmap, getCategories, getSLABreaches, getLeaderboard, getAISummary
} from '../api'
import StatusBadge from '../components/StatusBadge'
import StatsCard from '../components/StatsCard'
import AgentLogFeed from '../components/AgentLogFeed'
import Leaderboard from '../components/Leaderboard'
import QRCodeBadge from '../components/QRCodeBadge'

const ICONS = {
  'Electrical': '⚡', 'Plumbing': '🔧', 'Internet / IT': '💻',
  'Cleaning': '🧹', 'HVAC / AC': '❄️', 'Security': '🔒',
  'Structural': '🏗️', 'Pest Control': '🐛',
}
const PRIORITY_COLORS = {
  Low: 'text-gray-500', Medium: 'text-amber-500',
  High: 'text-orange-500', Critical: 'text-red-500 font-bold'
}
const CAT_COLORS = [
  'bg-blue-500','bg-purple-500','bg-green-500','bg-amber-500',
  'bg-red-500','bg-cyan-500','bg-indigo-500','bg-pink-500',
]
const LOCATIONS = [
  'Engineering Block','Science Block','Admin Block','Library',
  'Residence A','Residence B','Cafeteria','Sports Complex','Main Gate','Lecture Hall A',
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [categories, setCategories] = useState([])
  const [slaBreaches, setSlaBreaches] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [tab, setTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('All')
  const [escalating, setEscalating] = useState({})
  const [simulating, setSimulating] = useState(false)

  const fetchAll = async () => {
    const [s, c, h, cat, sla, lb] = await Promise.all([
      getDashboardStats(), listComplaints(), getHeatmap(),
      getCategories(), getSLABreaches(), getLeaderboard()
    ])
    setStats(s.data)
    setComplaints(c.data)
    setHeatmap(h.data)
    setCategories(cat.data)
    setSlaBreaches(sla.data)
    setLeaderboard(lb.data)
  }

  useEffect(() => {
    fetchAll()
    const i = setInterval(fetchAll, 10000)
    return () => clearInterval(i)
  }, [])

  const handleEscalate = async (id) => {
    setEscalating(e => ({ ...e, [id]: true }))
    try { await escalateComplaint(id); fetchAll() }
    catch (e) { console.error(e) }
    finally { setEscalating(e => ({ ...e, [id]: false })) }
  }

  const handleSimulate = async () => {
    if (!window.confirm('Simulate 20 random complaints right now?')) return
    setSimulating(true)
    try { await simulateChaos(20); await fetchAll() }
    catch (e) { alert('Simulation failed: ' + e.message) }
    finally { setSimulating(false) }
  }

  const filtered = statusFilter === 'All'
    ? complaints
    : complaints.filter(c => c.status === statusFilter)

  const maxHeat = heatmap.length > 0 ? Math.max(...heatmap.map(h => h.count)) : 1
  const maxCat = categories.length > 0 ? Math.max(...categories.map(c => c.count)) : 1

  if (!stats) return (
    <div className="flex items-center justify-center h-[300px]">
      <div className="spinner w-9 h-9 border-[3px]"></div>
    </div>
  )

  const TABS = [
    ['overview', '📊 Overview'],
    ['log', '🔴 Live Agent Log'],
    ['complaints', '📋 Complaints'],
    ['leaderboard', '🏆 Leaderboard'],
    ['staff', '👷 Staff'],
    ['qr', '📱 QR Codes'],
    ['summary', '📝 AI Report'],
  ]

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold m-0 bg-gradient-to-br from-[var(--accent)] to-[#dd6b20] bg-clip-text text-transparent font-heading">
            🛡️ Admin Command Center
          </h1>
          <p className="text-[var(--text-muted)] mt-1.5 text-[14px] font-medium">
            Real-time oversight of campus complaints, agent decisions, and staff performance.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            className="btn-danger !bg-gradient-to-r from-red-600 to-orange-600 !border-none shadow-lg shadow-red-500/30 font-bold"
            onClick={handleSimulate}
            disabled={simulating}
          >
            {simulating ? '✨ Simulating...' : '🧨 Simulate Chaos (Demo)'}
          </button>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_#4ade80]" />
            <span className="text-green-600 text-[12px] font-bold uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap mb-6">
        <StatsCard label="Total" value={stats.total} icon="📋" color="#8b5cf6" />
        <StatsCard label="Pending" value={stats.pending} icon="⏳" color="#f59e0b" />
        <StatsCard label="Under Review" value={stats.pending_review ?? 0} icon="🔍" color="#6366f1" sub="Low-confidence AI" />
        <StatsCard label="Assigned" value={stats.assigned} icon="👷" color="#3b82f6" />
        <StatsCard label="In Progress" value={stats.in_progress} icon="🔄" color="#a855f7" />
        <StatsCard label="Resolved" value={stats.resolved} icon="✅" color="#22c55e" />
        <StatsCard label="Escalated" value={stats.escalated} icon="🚨" color="#ef4444"
          sub={stats.escalated > 0 ? 'Needs attention' : 'All clear'} />
        <StatsCard label="Avg Resolution" value={stats.avg_resolution_minutes ? `${stats.avg_resolution_minutes}m` : 'N/A'} icon="⏱️" color="#0ea5e9" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`
            px-4 py-2 rounded-xl cursor-pointer font-semibold text-[13px] transition-all duration-200 border
            ${tab === k
              ? 'bg-gradient-to-r from-[var(--accent)] to-[#dd6b20] text-white shadow-md border-transparent'
              : 'border-gray-200 bg-white text-[var(--text-muted)] hover:bg-gray-50 hover:text-[var(--text-main)] shadow-sm'}
          `}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="card">
            <h3 className="m-0 mb-5 font-bold text-[14px] text-[var(--text-muted)] uppercase tracking-wider font-heading">Status Distribution</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Resolved', val: stats.resolved, bg: 'bg-green-500' },
                { label: 'In Progress', val: stats.in_progress, bg: 'bg-purple-500' },
                { label: 'Assigned', val: stats.assigned, bg: 'bg-blue-500' },
                { label: 'Pending', val: stats.pending, bg: 'bg-amber-500' },
                { label: 'Escalated', val: stats.escalated, bg: 'bg-red-500' },
              ].map(({ label, val, bg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-[90px] text-[13px] text-[var(--text-muted)] font-medium">{label}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${bg}`}
                        style={{ width: stats.total ? `${(val / stats.total) * 100}%` : '0%' }} />
                    </div>
                  </div>
                  <div className="text-[13px] font-bold w-8 text-right text-gray-700">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Chart */}
          <div className="card">
            <h3 className="m-0 mb-5 font-bold text-[14px] text-[var(--text-muted)] uppercase tracking-wider font-heading">By Category</h3>
            {categories.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {categories.slice(0, 8).map(({category, count}, i) => (
                  <div key={category} className="flex items-center gap-3">
                    <div className="text-base w-6">{ICONS[category] || '❓'}</div>
                    <div className="w-[110px] text-[12px] text-[var(--text-muted)] font-medium truncate">{category}</div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${CAT_COLORS[i % CAT_COLORS.length]}`}
                          style={{ width: `${(count / maxCat) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-[12px] font-bold text-gray-700 w-5 text-right">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Heatmap */}
          <div className="card md:col-span-2">
            <h3 className="m-0 mb-5 font-bold text-[14px] text-[var(--text-muted)] uppercase tracking-wider font-heading">📍 Campus Complaint Heatmap</h3>
            {heatmap.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No location data yet</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {LOCATIONS.map(loc => {
                  const found = heatmap.find(h => h.location === loc)
                  const count = found?.count || 0
                  const intensity = count / maxHeat
                  const bg = intensity > 0.7 ? 'bg-red-500 text-white' :
                             intensity > 0.4 ? 'bg-orange-400 text-white' :
                             intensity > 0.1 ? 'bg-amber-300 text-gray-900' : 'bg-gray-100 text-gray-500'
                  return (
                    <div key={loc}
                      className={`px-4 py-3 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition-all duration-300 shadow-sm ${bg}`}
                      style={{ opacity: count === 0 ? 0.5 : 1 }}
                    >
                      <span>{loc}</span>
                      <span className="font-black text-[15px]">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active Escalations */}
          {complaints.filter(c => c.status === 'Escalated').length > 0 ? (
            <div className="card border-l-4 border-l-red-500">
              <h3 className="m-0 mb-4 font-bold text-[14px] text-red-500 uppercase tracking-wider flex items-center gap-2 font-heading">
                🚨 Active Escalations
              </h3>
              <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-2">
                {complaints.filter(c => c.status === 'Escalated').map(c => (
                  <div key={c.id} className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <div className="font-bold text-[14px]">{ICONS[c.issue_type]} #{c.id} — {c.issue_type} at {c.location}</div>
                      <div className="text-gray-500 text-[12px] truncate mt-0.5">{c.description}</div>
                      <div className="text-red-600 text-[11px] font-bold mt-1 uppercase">Escalated {c.escalation_count}×</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center bg-gray-50/50 border-dashed min-h-[160px]">
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-50">✨</div>
                <h3 className="text-gray-500 font-medium m-0">Zero Active Escalations</h3>
                <p className="text-gray-400 text-sm m-0 mt-1">Excellent system status.</p>
              </div>
            </div>
          )}

          {/* SLA Breach History */}
          <div className="card">
            <h3 className="m-0 mb-4 font-bold text-[14px] text-[var(--text-muted)] uppercase tracking-wider font-heading">⏰ SLA Breach History</h3>
            {slaBreaches.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No SLA breaches recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                {slaBreaches.slice(0, 10).map(b => (
                  <div key={b.id} className="flex items-center justify-between text-[13px] py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="font-semibold">#{b.id}</span>
                      <span className="text-gray-500 mx-2">·</span>
                      <span>{ICONS[b.issue_type]} {b.issue_type}</span>
                      <span className="text-gray-400 ml-2">{b.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded">{b.escalation_count}× escalated</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIVE AGENT LOG ── */}
      {tab === 'log' && (
        <div className="animate-fade-in">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="m-0 font-bold text-[16px] text-[var(--primary-deep)] font-heading">🔴 Live Agent Decision Log</h3>
              <span className="text-[11px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">Live</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-5">
              Real-time stream of every decision made by the autonomous agent system. Submit a complaint or simulate chaos to see agents think.
            </p>
            <AgentLogFeed />
          </div>
        </div>
      )}

      {/* ── COMPLAINTS TABLE ── */}
      {tab === 'complaints' && (
        <div className="card animate-fade-in p-0 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-wrap gap-4">
            <h3 className="m-0 font-bold text-[16px] text-[var(--primary-deep)] font-heading">All Complaints ({filtered.length})</h3>
            <div className="flex gap-1.5 flex-wrap">
              {['All', 'Pending', 'Pending Review', 'Assigned', 'In Progress', 'Resolved', 'Escalated'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`
                  px-3 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-all border
                  ${statusFilter === f ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}
                `}>{f}</button>
              ))}
            </div>
          </div>
          <div className="table-wrap rounded-none shadow-none">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['ID','Issue','Location','Priority','Status','Staff','AI Conf.','Sentiment','Rating','Escalated','Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="text-center text-gray-500 py-12">No complaints matching this filter.</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">#{c.id}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">{ICONS[c.issue_type]} {c.issue_type || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 text-[13px]">{c.location}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[12px] font-bold ${PRIORITY_COLORS[c.priority]}`}>{c.priority}</span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4 text-[13px]">
                      {c.assigned_staff
                        ? <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">👤 {c.assigned_staff.name}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(c.ai_confidence * 100)}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600">{Math.round(c.ai_confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.sentiment_score != null ? (
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${c.sentiment_score > 0.6 ? 'bg-red-500' : c.sentiment_score > 0.3 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.round(c.sentiment_score * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500">{Math.round(c.sentiment_score * 100)}%</span>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.student_rating ? '⭐'.repeat(c.student_rating) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.escalation_count > 0
                        ? <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-xs">{c.escalation_count}×</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {c.status !== 'Resolved' && (
                        <button className="btn-danger !py-1 !px-2.5 !text-[11px]"
                          onClick={() => handleEscalate(c.id)} disabled={escalating[c.id]}>
                          {escalating[c.id] ? '...' : '🚨 Escalate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div className="animate-fade-in max-w-[700px]">
          <div className="card">
            <h3 className="m-0 mb-2 font-bold text-[18px] text-[var(--primary-deep)] font-heading">🏆 Staff Points Leaderboard</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Points are earned by resolving complaints. Critical = 50pts, High = 30pts, Medium = 20pts, Low = 10pts.
            </p>
            <Leaderboard staffList={leaderboard} />
          </div>
        </div>
      )}

      {/* ── STAFF PERFORMANCE ── */}
      {tab === 'staff' && (
        <div className="card animate-fade-in p-0 overflow-hidden">
          <h3 className="m-0 p-6 border-b border-gray-100 font-bold text-[16px] text-[var(--primary-deep)] font-heading">
            Staff Performance Analytics
          </h3>
          <div className="table-wrap rounded-none shadow-none">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Name','Role','Zone','Availability','Load','Total','Resolved','Rate','Avg Time','Points','Avg Rating'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.staff_performance.map(s => {
                  const rate = s.total_assigned > 0 ? Math.round((s.resolved / s.total_assigned) * 100) : 0
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-800">{s.name}</td>
                      <td className="py-3 px-4 text-gray-500 text-[13px]">{s.role}</td>
                      <td className="py-3 px-4 text-gray-600 text-[13px]">{s.building}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${s.current_load === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.current_load === 0 ? '🟢 Free' : '🔴 Busy'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-bold ${s.current_load > 2 ? 'text-amber-500' : 'text-gray-500'}`}>{s.current_load}</td>
                      <td className="py-3 px-4 text-gray-600">{s.total_assigned}</td>
                      <td className="py-3 px-4 font-bold text-green-600">{s.resolved}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rate >= 70 ? 'bg-green-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-[12px] font-bold text-gray-600">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-gray-600">
                        {s.avg_resolution_minutes ? `${s.avg_resolution_minutes}m` : '—'}
                      </td>
                      <td className="py-3 px-4 font-black text-amber-600">{s.points}</td>
                      <td className="py-3 px-4 text-[13px]">
                        {s.avg_rating ? `${'⭐'.repeat(Math.round(s.avg_rating))} (${s.avg_rating})` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QR CODES ── */}
      {tab === 'qr' && (
        <div className="animate-fade-in">
          <div className="card">
            <h3 className="m-0 mb-2 font-bold text-[18px] text-[var(--primary-deep)] font-heading">📱 QR Codes for Campus Locations</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Print or display these QR codes at each location. Scanning auto-fills the complaint form with that location.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {LOCATIONS.map(loc => (
                <QRCodeBadge key={loc} location={loc} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI EXECUTIVE SUMMARY ── */}
      {tab === 'summary' && (
        <div className="animate-fade-in max-w-[800px]">
          <div className="card">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h3 className="m-0 font-bold text-[18px] text-[var(--primary-deep)] font-heading">📝 AI Executive Report</h3>
                <p className="text-[var(--text-muted)] text-sm mt-1">Autonomous analysis of all campus maintenance activity.</p>
              </div>
              <button
                className="btn-primary !bg-gradient-to-r from-indigo-600 to-purple-600 !border-none shadow-lg"
                onClick={async () => {
                  setSummaryLoading(true)
                  try { const r = await getAISummary(); setSummary(r.data) }
                  catch (e) { console.error(e) }
                  finally { setSummaryLoading(false) }
                }}
                disabled={summaryLoading}
              >
                {summaryLoading ? <><span className="spinner w-4 h-4 border-white" />Generating...</> : '🤖 Generate AI Report'}
              </button>
            </div>

            {!summary && !summaryLoading && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-gray-500 font-medium">Click "Generate AI Report" to create an autonomous executive summary.</p>
                <p className="text-gray-400 text-sm mt-2">The AI will analyze all complaints, staff performance, and hotspots.</p>
              </div>
            )}

            {summaryLoading && (
              <div className="text-center py-16">
                <div className="spinner w-10 h-10 border-[3px] border-indigo-500 border-t-transparent mx-auto mb-4" />
                <p className="text-indigo-600 font-semibold">AI is analyzing campus data...</p>
              </div>
            )}

            {summary && !summaryLoading && (
              <div className="animate-fade-in">
                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Total', val: summary.stats.total, color: '#8b5cf6' },
                    { label: 'Resolved', val: `${summary.stats.resolution_rate_pct}%`, color: '#22c55e' },
                    { label: 'Escalated', val: summary.stats.escalated, color: '#ef4444' },
                    { label: 'Avg Time', val: summary.stats.avg_resolution_minutes ? `${summary.stats.avg_resolution_minutes}m` : 'N/A', color: '#0ea5e9' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                      <div className="font-black text-2xl" style={{ color }}>{val}</div>
                      <div className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wide">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Summary text */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
                  <div className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                    {summary.summary.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="text-indigo-800">{part}</strong> : part
                    )}
                  </div>
                </div>

                {/* Copy button */}
                <button
                  className="mt-4 btn-ghost text-sm"
                  onClick={() => navigator.clipboard.writeText(summary.summary.replace(/\*\*/g, ''))}
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
