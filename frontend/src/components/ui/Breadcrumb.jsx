import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center" style={{ gap: 6 }}>
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span className={isLast ? 'current' : ''}>{item.label}</span>
            )}
            {!isLast && (
              <span className="sep">
                <ChevronRight size={14} />
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
