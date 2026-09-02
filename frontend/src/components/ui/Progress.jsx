import { cn } from '../../utils/helpers'

export default function Progress({ value = 0, color, className }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('progress', className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('progress-fill', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}