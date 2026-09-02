export default function Table({ columns, data, rowKey = 'id', onRowClick, empty, loading, loadingRows = 5 }) {
  if (loading) {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key || col.header}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j}>
                    <div className="skeleton" style={{ width: `${60 + ((i + j) % 4) * 10}%`, height: 14 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <>{empty}</>
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.header} style={col.style}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row[rowKey] ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key || col.header} style={col.style}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
