/**
 * components/Leaderboard.jsx — Staff gamification leaderboard with medal ranks.
 */

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_COLORS = {
  1: 'from-yellow-400/20 to-amber-400/10 border-yellow-400/40',
  2: 'from-gray-300/20 to-gray-400/10 border-gray-400/40',
  3: 'from-orange-400/20 to-amber-600/10 border-orange-400/40',
}

export default function Leaderboard({ staffList }) {
  if (!staffList || staffList.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-3xl mb-2">🏆</p>
        <p className="font-medium">No points earned yet.</p>
        <p className="text-sm mt-1">Resolve complaints to earn points!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {staffList.map((s, i) => {
        const rank = i + 1
        const isMedal = rank <= 3
        const width = staffList[0].points > 0 ? `${Math.round((s.points / staffList[0].points) * 100)}%` : '0%'

        return (
          <div
            key={s.id}
            className={`flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r transition-all duration-200 hover:scale-[1.01]
              ${isMedal ? RANK_COLORS[rank] : 'border-gray-100 from-white to-gray-50/50'}`}
          >
            {/* Rank */}
            <div className="text-2xl w-10 text-center shrink-0">
              {isMedal ? MEDAL[rank] : (
                <span className="text-[15px] font-black text-gray-400">#{rank}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-[15px] ${isMedal ? 'text-gray-900' : 'text-gray-700'}`}>
                  {s.name}
                </span>
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {s.role}
                </span>
                {!s.is_available && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                    Busy
                  </span>
                )}
              </div>
              {/* Points bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                  style={{ width }}
                />
              </div>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <div className={`font-black text-[20px] leading-none ${isMedal ? 'text-amber-600' : 'text-gray-600'}`}>
                {s.points}
              </div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
