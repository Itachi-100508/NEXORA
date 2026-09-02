export default function Skeleton({ width = '100%', height = 14, className = '', style }) {
  return <div className={`skeleton ${className}`} style={{ width, height, ...style }} />
}

export function SkeletonBlock({ rows = 5, height = 14, style, className }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...style }} className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} width={`${94 - (i % 4) * 8}%`} />
      ))}
    </div>
  )
}
