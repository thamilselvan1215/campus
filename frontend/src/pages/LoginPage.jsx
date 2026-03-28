/**
 * pages/LoginPage.jsx — Role-based login screen for AutoFix Campus.
 * Stores role + name in localStorage. No real server-side auth needed for demo.
 */
import { useState } from 'react'
import api from '../api'

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: '🎓',
    desc: 'Submit and track campus complaints',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selected: 'ring-blue-400 border-blue-400 bg-blue-50',
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: '👷',
    desc: 'Manage assigned tasks and verify resolutions',
    gradient: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selected: 'ring-orange-400 border-orange-400 bg-orange-50',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: '🛡️',
    desc: 'Full system oversight, analytics and control',
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selected: 'ring-purple-400 border-purple-400 bg-purple-50',
  },
]

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!selectedRole) return setError('Please select a role.')
    if (!name.trim()) return setError('Please enter your name.')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { role: selectedRole, name: name.trim() })
      const { token, role } = res.data
      localStorage.setItem('autofix_user', JSON.stringify({ role, name: name.trim(), token }))
      onLogin({ role, name: name.trim() })
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const activeRole = ROLES.find(r => r.key === selectedRole)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a365d] to-[#0f172a] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(237,137,54,0.4)]">
            🤖
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">AutoFix Campus</h1>
          <p className="text-blue-300 text-sm mt-1">Autonomous AI Complaint Resolution</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-1">Select Your Role</h2>
          <p className="text-blue-300 text-sm mb-6">Choose how you want to access the system.</p>

          {/* Role selector */}
          <div className="flex flex-col gap-3 mb-6">
            {ROLES.map(role => (
              <button
                key={role.key}
                type="button"
                onClick={() => setSelectedRole(role.key)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                  ${selectedRole === role.key
                    ? 'border-white/40 bg-white/10 ring-2 ring-white/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                  {role.icon}
                </div>
                <div>
                  <div className="font-bold text-white">{role.label}</div>
                  <div className="text-blue-300 text-[12px]">{role.desc}</div>
                </div>
                {selectedRole === role.key && (
                  <div className="ml-auto text-white text-lg">✓</div>
                )}
              </button>
            ))}
          </div>

          {/* Name input */}
          <form onSubmit={handleLogin}>
            <label className="block text-blue-300 text-sm font-semibold mb-2">Your Name</label>
            <input
              type="text"
              placeholder={`e.g. ${selectedRole === 'student' ? 'Thamizh Kumar' : selectedRole === 'staff' ? 'Ravi Kumar' : 'Dr. Sharma'}`}
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              className="w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 px-4 py-3 text-sm outline-none focus:border-white/40 focus:bg-white/15 transition-all mb-4"
            />

            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedRole || !name.trim()}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-200 text-[15px]
                ${selectedRole && name.trim()
                  ? `bg-gradient-to-r ${activeRole?.gradient || 'from-blue-500 to-indigo-600'} hover:shadow-lg hover:-translate-y-0.5`
                  : 'bg-white/10 cursor-not-allowed opacity-50'
                }`}
            >
              {loading ? '⏳ Signing in...' : `Enter as ${selectedRole ? ROLES.find(r => r.key === selectedRole)?.label : '...'}`}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-400/60 text-xs mt-6">
          AutoFix Campus — Hackathon Demo Build 🚀
        </p>
      </div>
    </div>
  )
}
