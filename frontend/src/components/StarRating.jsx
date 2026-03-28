/**
 * components/StarRating.jsx — Interactive 1-5 star rating widget.
 */
import { useState } from 'react'

export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`${sizes[size]} transition-all duration-150 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'
            } ${filled ? 'opacity-100' : 'opacity-30'}`}
            style={{ filter: filled ? 'drop-shadow(0 0 4px #fbbf24)' : 'none' }}
          >
            ⭐
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-bold text-amber-500 self-center">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][value]}
        </span>
      )}
    </div>
  )
}
