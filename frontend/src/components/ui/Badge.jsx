import { cn } from '../../utils/helpers'

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  accent: 'badge-accent',
  muted: 'badge-muted',
  neutral: 'badge-neutral',
  info: 'badge-info',
}

export default function Badge({ variant = 'neutral', dot = false, children, className, ...rest }) {
  return (
    <span className={cn('badge', variants[variant], className)} {...rest}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}
