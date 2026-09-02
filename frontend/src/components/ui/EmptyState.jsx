import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="state-block">
      <div className="state-icon">
        <Icon size={28} />
      </div>
      <div>
        <div className="state-title">{title}</div>
        {description && <div className="state-desc">{description}</div>}
      </div>
      {action}
    </div>
  )
}
