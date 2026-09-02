import Badge from './Badge'

const STATUS_MAP = {
  ACTIVE: { variant: 'success', label: 'Active' },
  INACTIVE: { variant: 'muted', label: 'Inactive' },
  DRAFT: { variant: 'muted', label: 'Draft' },
  PENDING: { variant: 'warning', label: 'Pending' },
  SUBMITTED: { variant: 'warning', label: 'Submitted' },
  UNDER_REVIEW: { variant: 'info', label: 'Under Review' },
  APPROVED: { variant: 'success', label: 'Approved' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
  RESUBMITTED: { variant: 'accent', label: 'Resubmitted' },
  UPCOMING: { variant: 'primary', label: 'Upcoming' },
  CLOSED: { variant: 'muted', label: 'Closed' },
  PUBLISHED: { variant: 'success', label: 'Published' },
  REQUESTED: { variant: 'warning', label: 'Requested' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  VERIFIED: { variant: 'success', label: 'Verified' },
}

export default function StatusBadge({ status, label }) {
  const config = STATUS_MAP[status] || { variant: 'neutral', label: status || 'Unknown' }
  return (
    <Badge variant={config.variant} dot>
      {label || config.label}
    </Badge>
  )
}
