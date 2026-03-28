/**
 * App.jsx — Main application with role-based nav, auth guard, and routing.
 */
import { useState, useEffect } from 'react'
import './index.css'
import LoginPage from './pages/LoginPage'
import StudentPanel from './pages/StudentPanel'
import StaffPanel from './pages/StaffPanel'
import AdminDashboard from './pages/AdminDashboard'

const ALL_TABS = [
  { key: 'student', label: '🎓 Student', component: StudentPanel, roles: ['student', 'admin'] },
  { key: 'staff',   label: '👷 Staff',   component: StaffPanel,   roles: ['staff', 'admin'] },
  { key: 'admin',   label: '🛡️ Admin',   component: AdminDashboard, roles: ['admin'] },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('autofix_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser(u)
        // Default tab by role
        const defaultTab = u.role === 'admin' ? 'admin' : u.role === 'staff' ? 'staff' : 'student'
        setActiveTab(defaultTab)
      } catch {}
    }
    setAuthChecked(true)
  }, [])

  const handleLogin = (u) => {
    setUser(u)
    const defaultTab = u.role === 'admin' ? 'admin' : u.role === 'staff' ? 'staff' : 'student'
    setActiveTab(defaultTab)
  }

  const handleLogout = () => {
    localStorage.removeItem('autofix_user')
    setUser(null)
    setActiveTab(null)
  }

  if (!authChecked) return null

  if (!user) return <LoginPage onLogin={handleLogin} />

  const visibleTabs = ALL_TABS.filter(t => t.roles.includes(user.role))
  const Active = ALL_TABS.find(t => t.key === activeTab)?.component

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] font-sans">
      {/* Top Nav */}
      <nav className="sticky top-0 z-[100] bg-[rgba(26,54,93,0.95)] backdrop-blur-md border-b border-[var(--primary-deep)] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#dd6b20] flex items-center justify-center text-lg shadow-[0_0_12px_rgba(237,137,54,0.4)]">
              🤖
            </div>
            <div>
              <div className="font-heading font-extrabold text-white text-[17px] leading-tight tracking-tight">AutoFix Campus</div>
              <div className="text-[10px] text-blue-200 tracking-[0.08em] uppercase font-semibold">AI Complaint Resolution</div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex gap-1.5">
            {visibleTabs.map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg cursor-pointer font-semibold text-[13px] border transition-all duration-200 ${
                    isActive
                      ? 'border-[var(--accent)] bg-[rgba(237,137,54,0.15)] text-white'
                      : 'border-transparent bg-transparent text-blue-200 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Right: Live indicator + User + Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[rgba(0,0,0,0.2)] rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block shadow-[0_0_8px_#4ade80]" />
              <span className="text-[11px] text-green-300 font-bold tracking-wide uppercase hidden sm:inline">Autonomous</span>
            </div>
            <div className="flex items-center gap-2 text-blue-200 text-[13px]">
              <span className="hidden sm:block">{user.role === 'student' ? '🎓' : user.role === 'staff' ? '👷' : '🛡️'}</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[12px] text-blue-300 hover:text-white border border-blue-400/30 hover:border-white/40 px-3 py-1 rounded-lg transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {Active && <Active currentUser={user} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 px-6 text-center text-[var(--text-muted)] text-[13px] font-medium">
        AutoFix Campus © 2025 — Powered by autonomous multi-agent AI engine
      </footer>
    </div>
  )
}
