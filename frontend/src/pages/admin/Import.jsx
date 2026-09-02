import { useRef, useState } from 'react'
import { CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { parseImportFile, confirmImport } from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function Import() {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    setBusy(true)
    const res = await parseImportFile(file)
    setPreview(res)
    setBusy(false)
  }

  const confirm = async () => {
    setBusy(true)
    const res = await confirmImport(preview.fileName)
    setBusy(false)
    setDone(res)
  }

  return (
    <div>
      <PageHeader title="Import Data" subtitle="Bulk import students and staff from CSV/Excel files." />

      {done ? (
        <Card padded>
          <div className="state-block">
            <div className="state-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <CheckCircle2 size={30} />
            </div>
            <div className="state-title">Import complete</div>
            <div className="state-desc">{done.imported} records imported, {done.skipped} row skipped due to errors.</div>
            <Button variant="outline" onClick={() => { setDone(false); setPreview(null) }}>Import another file</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-2" style={{ gridTemplateColumns: '1fr' }}>
          <Card padded>
            <div
              className={dragging ? 'drop-zone dragging' : 'drop-zone'}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files?.[0])
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
              aria-label="Upload a CSV or Excel file"
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="m-0" hidden onChange={(e) => handleFile(e.target.files?.[0])} data-testid="import-file" />
              <div className="dz-icon"><UploadCloud size={26} /></div>
              <div className="cell-main" style={{ fontSize: 15 }}>Drop your file here or click to browse</div>
              <div className="muted" style={{ fontSize: 13 }}>Supports .csv, .xlsx, .xls · students, teachers or marks templates</div>
              <Button variant="outline" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>
                <FileSpreadsheet size={16} /> Choose file
              </Button>
            </div>
          </Card>

          {busy && !preview && (
            <Card padded>
              <div className="flex items-center gap-3 muted"><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Parsing file…
            </div>
            </Card>
          )}

          {preview && (
            <div className="grid grid-2" style={{ gridTemplateColumns: '1fr' }}>
              <Card>
                <div className="card-header"><h3>Parsing summary</h3><Badge variant="primary">{preview.fileName}</Badge></div>
                <div className="card-body">
                  <div className="grid grid-3" style={{ marginBottom: 16 }}>
                    <div><div style={{ fontSize: 24, fontWeight: 800 }}>{preview.rowsDetected}</div><div className="muted" style={{ fontSize: 12.5 }}>Rows detected</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{preview.validRows}</div><div className="muted" style={{ fontSize: 12.5 }}>Valid</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>{preview.invalidRows}</div><div className="muted" style={{ fontSize: 12.5 }}>Invalid</div></div>
                  </div>
                  {preview.errors?.length > 0 && (
                    <div className="import-errors">
                      <h5>Rows with issues</h5>
                      <ul>{preview.errors.map((e, i) => <li key={i}>Row {e.row}: {e.msg}</li>)}</ul>
                    </div>
                  )}
                  <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-light)', color: 'var(--warning-dark)', fontSize: 12.5 }}>
                    <b>Review before import:</b> invalid rows are skipped automatically. Headers expected: {preview.columns?.join(' · ')}.
                  </div>
                </div>
              </Card>

              <Card>
                <div className="card-header"><h3>Preview</h3></div>
                <div className="card-body">
                  <div className="table-wrap">
                    <table className="table marks-table">
                      <thead>
                        <tr><th>Roll</th><th>Name</th><th>Dept</th></tr>
                      </thead>
                      <tbody>
                        {preview.preview?.map((r, i) => (
                          <tr key={i} className={!r.name ? 'row-invalid' : ''}>
                            <td>{r.roll}</td>
                            <td className={!r.name ? 'muted' : 'cell-main'}>{r.name || '— missing —'}</td>
                            <td>{r.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex" style={{ gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                    <Button variant="danger-soft" onClick={() => setPreview(null)}>Cancel</Button>
                    <Button onClick={confirm} loading={busy}><CheckCircle2 size={16} /> Confirm import</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}