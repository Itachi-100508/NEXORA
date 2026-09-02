import { cn } from '../../utils/helpers'

export default function Card({ children, className, padded = false, ...rest }) {
  return (
    <div className={cn('card', padded && 'card-pad', className)} {...rest}>
      {children}
    </div>
  )
}
