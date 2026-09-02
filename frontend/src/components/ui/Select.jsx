import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'

const Select = forwardRef(function Select({ label, error, hint, className, children, ...rest }, ref) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {rest.required && <span className="req">*</span>}
        </label>
      )}
      <select ref={ref} className={cn('form-control', error && 'has-error', className)} {...rest}>
        {children}
      </select>
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  )
})

export default Select
