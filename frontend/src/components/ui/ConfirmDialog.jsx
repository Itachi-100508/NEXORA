import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="flex" style={{ gap: 16 }}>
        <motion.div
          className="state-icon"
          style={{
            background: variant === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)',
            color: variant === 'danger' ? 'var(--danger)' : 'var(--warning)',
            flexShrink: 0,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <AlertTriangle size={26} />
        </motion.div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
          {description && <p className="muted" style={{ fontSize: 13.5 }}>{description}</p>}
        </div>
      </div>
      <div className="flex justify-between" style={{ gap: 10, marginTop: 24 }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'warning'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
