import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

const initial = [
  { id: 1, title: 'Marks submission approved', text: 'Your submitted marks for Embedded Systems were approved by the admin.', time: '2 hours ago', unread: true, type: 'success' },
  { id: 2, title: 'New assignment assigned', text: 'You have been assigned Database Systems for class SE-I B (End Semester Examination).', time: '1 day ago', unread: true, type: 'primary' },
  { id: 3, title: 'Result published', text: 'Your Semester 2 result has been published. View it from My Results.', time: '5 days ago', unread: false, type: 'secondary' },
  { id: 4, title: 'Exam schedule announced', text: 'Mid Semester Examination for Semester 4 starts on 10 Aug 2026.', time: '1 week ago', unread: false, type: 'warning' },
]

const iconMap = {
  success: 'var(--success)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  warning: 'var(--warning)',
}

export default function Notifications() {
  const [items, setItems] = useState(initial)
  const unreadCount = items.filter((i) => i.unread).length

  const markAll = () => setItems((prev) => prev.map((i) => ({ ...i, unread: false })))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <div className="sub">Stay updated with the latest activity.</div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      <Card>
        <div className="card-body" style={{ padding: '14px 22px' }}>
          {unreadCount > 0 && (
            <Badge variant="primary" style={{ marginBottom: 14 }} dot>{unreadCount} unread</Badge>
          )}
          {items.length ? (
            <div className="notif-list">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className="notif-item"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ background: item.unread ? 'var(--primary-light)' : 'var(--surface)' }}
                  >
                    <span className="notif-icon" style={{ color: iconMap[item.type], background: undefined }}>
                      <Bell size={18} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="notif-title">{item.title}</div>
                      <div className="muted" style={{ fontSize: 13 }}>{item.text}</div>
                    </div>
                    <span className="notif-time">{item.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
          )}
        </div>
      </Card>
    </div>
  )
}