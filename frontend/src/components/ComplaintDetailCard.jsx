import React from 'react';
import StatusBadge from './StatusBadge';
import StarRating from './StarRating';
import { ICONS, PRIORITY_COLORS } from '../utils/constants';

export default function ComplaintDetailCard({ c, onRate, ratingState }) {
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
