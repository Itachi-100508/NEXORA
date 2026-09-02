import { AlertTriangle } from 'lucide-react'

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="state-block">
      <div className="state-icon error">
        <AlertTriangle size={28} />
      </div>
      <div>
        <div className="state-title">Unable to load</div>
        <div className="state-desc">{message}</div>
      </div>
      {onRetry && (
        <button className="btn btn-outline btn-sm" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}
