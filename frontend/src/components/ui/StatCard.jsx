import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

const iconVariants = {
  primary: 'ic-primary',
  secondary: 'ic-secondary',
  accent: 'ic-accent',
  success: 'ic-success',
  warning: 'ic-warning',
  danger: 'ic-danger',
}

export default function StatCard({ label, value, icon: Icon, variant = 'primary', trend, index = 0 }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <div className="stat-top">
        <div className={`stat-icon ${iconVariants[variant] || iconVariants.primary}`}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  )
}
