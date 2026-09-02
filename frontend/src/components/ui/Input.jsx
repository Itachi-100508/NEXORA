import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'

const Input = forwardRef(function Input({ label, error, hint, className, icon: Icon, ...rest }, ref) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {rest.required && <span className="req">*</span>}
        </label>
      )}
      <div className={Icon ? 'input-icon-wrap' : undefined}>
        {Icon && (
          <span className="input-icon">
            <Icon size={17} />
          </span>
        )}
        <input ref={ref} className={cn('form-control', error && 'has-error', className)} {...rest} />
      </div>
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  )
})

export default Input
