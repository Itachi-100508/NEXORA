import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/helpers'

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={cn('modal', size === 'lg' && 'modal-lg', size === 'sm' && 'modal-sm')}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
          >
            {title && (
              <div className="modal-header">
                <h3>{title}</h3>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
