import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Dropdown({ trigger, children, align = 'right', width = 200 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="dropdown" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-menu"
            style={{ right: align === 'right' ? 0 : 'auto', left: align === 'left' ? 0 : 'auto', minWidth: width }}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({ children, onClick, icon: Icon, danger, ...rest }) {
  return (
    <button className={`dropdown-item ${danger ? 'danger' : ''}`} onClick={onClick} {...rest}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export function DropdownSep() {
  return <div className="dropdown-sep" />
}
