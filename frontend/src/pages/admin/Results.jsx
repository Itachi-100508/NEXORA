import { useEffect, useState } from 'react'
import { Trophy, Send, Eye, CheckCircle2 } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { getReadyToPublish } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/helpers'

export default function AdminResults() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [publishId, setPublishId] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [publishing, setPublishing] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getReadyToPublish()
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openPreview = (row) => {
    setSelected(row)
    setPreviewOpen(true)
  }

  const handlePublish = () => {
    setPublishing(true)
    setTimeout(() => {
      setData((prev) => prev.map((r) => (r.id === publishId ? { ...r, status: 'PUBLISHED' } : r)))
      setPublishId(null)
      setPreviewOpen(false)
      setPublishing(false)
      toast.success('Result published', 'This result is now visible to students.')
    }, 800)
  }

  const columns = [
    { key: 'subject', header: 'Subject', render: (r) => <span className="cell-main">{r.subject}</span> },
    { key: 'className', header: 'Class' },
    { key: 'exam', header: 'Exam' },
    { key: 'teacher', header: 'Teacher' },
    { key: 'submittedAt', header: 'Approved', render: (r) => <span className="muted">{formatDate(r.submittedAt)}</span> },
    { key: 'students', header: 'Students', render: (r) => <Badge variant="secondary">{r.students}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      style: { textAlign: 'right' },
      render: (row) => (
        <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={() => openPreview(row)} title="Preview" aria-label="Preview"><Eye size={16} /></button>
          {row.status === 'APPROVED' && (
            <Button variant="success" size="sm" onClick={() => setPublishId(row.id)}>
              <Send size={14} /> Publish
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Results" subtitle="Approve and publish final results." />

      <Card>
        <div className="card-header">
          <h3 className="flex items-center" style={{ gap: 8 }}><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> Ready to Publish</h3>
          <Badge variant="primary">{data.filter((r) => r.status === 'APPROVED').length} pending</Badge>
        </div>
        <div className="card-body">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            empty={<EmptyState icon={Trophy} title="Nothing to publish" description="Approved results will appear here and can be published to students." />}
          />
        </div>
      </Card>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview Result" size="lg">
        {selected && (
          <div>
            <div className="grid grid-2" style={{ marginBottom: 18 }}>
              <div className="detail-row"><span className="k">Subject</span><span className="v">{selected.subject}</span></div>
              <div className="detail-row"><span className="k">Exam</span><span className="v">{selected.exam}</span></div>
              <div className="detail-row"><span className="k">Class</span><span className="v">{selected.className}</span></div>
              <div className="detail-row"><span className="k">Teacher</span><span className="v">{selected.teacher}</span></div>
              <div className="detail-row"><span className="k">Students</span><span className="v">{selected.students}</span></div>
              <div className="detail-row"><span className="k">Status</span><span className="v"><StatusBadge status={selected.status} /></span></div>
            </div>
            <div className="flex" style={{ gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>
              {selected.status === 'APPROVED' && (
                <Button variant="success" onClick={() => { setPreviewOpen(false); setPublishId(selected.id) }}>
                  <Send size={16} /> Publish Result
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(publishId)}
        title="Publish this result?"
        description="Once published, this result becomes visible to all students in the class through their dashboards. This action cannot be undone."
        confirmLabel="Publish Result"
        variant="success"
        loading={publishing}
        onCancel={() => setPublishId(null)}
        onConfirm={handlePublish}
      />
    </div>
  )
}
