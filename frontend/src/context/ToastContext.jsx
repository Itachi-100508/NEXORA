import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

function Toast({ toast, onClose }) {
  const icons = {
    success: <CheckCircle2 size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  }

  return (
    <motion.div
      className={`toast toast-${toast.type}`}
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onClick={() => onClose(toast.id)}
    >
      <span className="toast-icon">{icons[toast.type]}</span>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.description && <div className="toast-desc">{toast.description}</div>}
      </div>
      <button className="toast-close" onClick={() => onClose(toast.id)} aria-label="Close">
        <X size={16} />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    ({ type = 'info', title, description }) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, type, title, description }])
      setTimeout(() => remove(id), 4500)
    },
    [remove],
  )

  const toast = useMemo(
    () => ({
      success: (title, description) => show({ type: 'success', title, description }),
      error: (title, description) => show({ type: 'error', title, description }),
      warning: (title, description) => show({ type: 'warning', title, description }),
      info: (title, description) => show({ type: 'info', title, description }),
    }),
    [show],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onClose={remove} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
