/**
 * components/StatusBadge.jsx — Color-coded status indicator badge
 */
export default function StatusBadge({ status }) {
  const map = {
    'Pending':     'badge-pending',
    'Assigned':    'badge-assigned',
    'In Progress': 'badge-in-progress',
    'Resolved':    'badge-resolved',
    'Escalated':   'badge-escalated',
  }
  const cls = map[status] || 'badge-pending'
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }} className={cls}>
      {status}
    </span>
  )
}
