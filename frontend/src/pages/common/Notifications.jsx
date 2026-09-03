import { useState } from 'react'
import { Bell, CheckCheck, Eye } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

const initial = [
  { id: 1, title: 'Marks submission approved', text: 'Your submitted marks for Embedded Systems were approved by the admin.', time: '2 hours ago', unread: true, type: 'success', category: 'SUCCESS', link: null },
  { id: 2, title: 'New assignment assigned', text: 'You have been assigned Database Systems for class SE-I B (End Semester Examination).', time: '1 day ago', unread: true, type: 'primary', category: 'ACTION_REQUIRED', link: '/teacher/assignments' },
  { id: 3, title: 'Result published', text: 'Your Semester 2 result has been published. View it from My Results.', time: '5 days ago', unread: false, type: 'secondary', category: 'INFORMATION', link: '/student/results' },
  { id: 4, title: 'Exam schedule announced', text: 'Mid Semester Examination for Semester 4 starts on 10 Aug 2026.', time: '1 week ago', unread: false, type: 'warning', category: 'ATTENTION', link: '/student/exam-calendar' },
]

const categories = ['ALL', 'ACTION_REQUIRED', 'ATTENTION', 'INFORMATION', 'SUCCESS']

const categoryVariant = {
  ACTION_REQUIRED: 'danger',
  ATTENTION: 'warning',
  INFORMATION: 'primary',
  SUCCESS: 'success',
}

const iconMap = {
  success: 'var(--success)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  warning: 'var(--warning)',
}

export default function Notifications() {
  const [items, setItems] = useState(initial)
  const [active, setActive] = useState('ALL')
  const unreadCount = items.filter((i) => i.unread).length

  const markAll = () => setItems((prev) => prev.map((i) => ({ ...i, unread: false })))
  const markRead = (id) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)))

  const goto = (link) => {
    if (!link) return
    window.location.href = link
  }

  const filtered = active === 'ALL' ? items : items.filter((i) => i.category === active)

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
          <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {categories.map((c) => (
              <button
                key={c}
                className={`notif-filter-chip ${active === c ? 'active' : ''}`}
                onClick={() => setActive(c)}
                aria-pressed={active === c}
              >
                {c === 'ALL' ? 'All' : c.replace('_', ' ')}
              </button>
            ))}
            {unreadCount > 0 && <Badge variant="primary" dot style={{ marginLeft: 'auto' }}>{unreadCount} unread</Badge>}
          </div>

          {filtered.length ? (
            <div className="notif-list">
              <AnimatePresence>
                {filtered.map((item) => (
                  <motion.div
                    key={item.id}
                    className="notif-item"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ background: item.unread ? 'var(--primary-light)' : 'var(--surface)' }}
                  >
                    <span className="notif-icon" style={{ color: iconMap[item.type] || 'var(--muted)', background: undefined }}>
                      <Bell size={18} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="notif-title">{item.title}</span>
                        <Badge variant={categoryVariant[item.category] || 'neutral'}>{item.category.replace('_', ' ')}</Badge>
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>{item.text}</div>
                      <div className="flex items-center" style={{ gap: 12, marginTop: 4 }}>
                        {item.link && (
                          <button className="link-more" style={{ fontSize: 12.5 }} onClick={() => goto(item.link)}>
                            View details →
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end" style={{ gap: 8 }}>
                      <span className="notif-time">{item.time}</span>
                      {item.unread && (
                        <Button size="sm" variant="ghost" onClick={() => markRead(item.id)} aria-label="Mark as read">
                          <Eye size={14} /> Read
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState icon={Bell} title="No notifications" description={active === 'ALL' ? "You're all caught up!" : `No ${active.replace('_', ' ')} notifications.`} />
          )}
        </div>
      </Card>
    </div>
  )
}
