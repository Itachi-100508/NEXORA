import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  icon,
  ...rest
}) {
  return (
    <motion.button
      whileTap={rest.disabled || loading ? undefined : { scale: 0.97 }}
      className={cn('btn', `btn-${variant}`, sizes[size], className)}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading ? <span className="btn-spinner" /> : icon}
      {children}
    </motion.button>
  )
}
