import React from 'react';
import StatusBadge from './StatusBadge';
import StarRating from './StarRating';
import { ICONS, PRIORITY_COLORS } from '../utils/constants';

export default function ComplaintRow({ c, onRate, ratingState }) {
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
