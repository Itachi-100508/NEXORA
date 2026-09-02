import { useEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/helpers'

const swatchThemes = {
  light: 'linear-gradient(135deg, #FFFFFF, #E6EAF0)',
  soft: 'linear-gradient(135deg, #FBF7F2, #E5D9C8)',
  cool: 'linear-gradient(135deg, #EEF3F9, #CFDCEB)',
  dark: 'linear-gradient(135deg, #0F172A, #1E293B)',
}

export default function ThemeSwitcher({ compact = false, onNavigate }) {
  const { theme, accent, setTheme, setAccent, themes, accents } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        title="Appearance"
        aria-label="Theme and accent"
        aria-expanded={open}
      >
        <Palette size={18} />
      </button>
      {open && (
        <div className="theme-popover">
          <h4>Theme</h4>
          <div className="theme-row">
            {themes.map((t) => (
              <button
                key={t.value}
                className={cn('theme-option', theme === t.value && 'active')}
                onClick={() => setTheme(t.value)}
              >
                <span className="theme-swatch" style={{ background: swatchThemes[t.value] }} />
                {t.label}
                {theme === t.value && <Check size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
          <h4 style={{ margin: '14px 0 10px' }}>Accent color</h4>
          <div className="accent-row">
            {accents.map((a) => (
              <button
                key={a.value}
                className={cn('accent-swatch', accent === a.value && 'active')}
                style={{ background: a.color }}
                onClick={() => setAccent(a.value)}
                title={a.label}
                aria-label={`Set accent to ${a.label}`}
              >
                {accent === a.value && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}