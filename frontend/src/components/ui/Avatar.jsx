import { getInitials } from '../../utils/helpers'
import { cn } from '../../utils/helpers'

export default function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('avatar', size === 'sm' && 'avatar-sm', size === 'lg' && 'avatar-lg', className)}
        style={{ objectFit: 'cover' }}
      />
    )
  }
  return (
    <span className={cn('avatar', size === 'sm' && 'avatar-sm', size === 'lg' && 'avatar-lg', className)}>
      {getInitials(name)}
    </span>
  )
}
