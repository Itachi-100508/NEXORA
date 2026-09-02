import Select from './Select'

export default function Filter({ label, value, onChange, options, placeholder = 'All' }) {
  return (
    <div style={{ minWidth: 160 }}>
      {label && (
        <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
          {label}
        </label>
      )}
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
