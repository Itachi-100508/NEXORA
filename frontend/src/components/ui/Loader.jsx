export default function Loader({ sm = false }) {
  return (
    <div className="loader-center">
      <div className={`spinner ${sm ? 'spinner-sm' : ''}`} />
    </div>
  )
}
