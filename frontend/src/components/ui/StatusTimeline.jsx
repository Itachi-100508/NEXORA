import { formatDateTime } from '../../utils/helpers'

export default function StatusTimeline({ events, currentStatus }) {
  const doneSet = new Set(events.map((e) => e.step))
  const isCurrent = (step) => step === currentStatus

  return (
    <ol className="status-timeline">
      {events.map((e) => (
        <li
          key={e.step}
          className={`timeline-item ${doneSet.has(e.step) ? 'done' : ''} ${isCurrent(e.step) ? 'current' : ''} ${e.step === 'rejected' ? 'rejected' : ''}`}
        >
          <span className="timeline-dot" />
          <div className="flex justify-between gap-2" style={{ alignItems: 'baseline' }}>
            <div className="timeline-label">{e.label}</div>
            {e.at && <div className="timeline-time">{formatDateTime(e.at)}</div>}
          </div>
          {e.note && <div className="timeline-note">{e.note}</div>}
        </li>
      ))}
    </ol>
  )
}