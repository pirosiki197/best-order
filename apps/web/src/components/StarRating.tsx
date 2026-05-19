import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverValue || value)

        return (
          <button
            key={star}
            type="button"
            className={cn(
              'p-1 transition-all duration-200 hover:scale-110 focus:outline-none',
              isActive ? 'text-amber-400' : 'text-muted/30',
            )}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={cn('h-8 w-8', isActive ? 'fill-amber-400' : 'fill-muted')}
              strokeWidth={1.5}
            />
          </button>
        )
      })}
    </div>
  )
}
