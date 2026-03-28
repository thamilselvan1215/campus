/**
 * components/StatsCard.jsx — Admin dashboard metric card
 */
export default function StatsCard({ label, value, icon, color, sub }) {
  return (
    <div className="card animate-fade-in" style={{ flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 32, fontWeight: 800, margin: '6px 0 0', color }}>{value}</p>
          {sub && <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>{sub}</p>}
        </div>
        <div style={{
          background: `${color}20`,
          border: `1px solid ${color}40`,
          borderRadius: 10,
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
