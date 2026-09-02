import { useState } from 'react'
import { QrCode, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../context/ToastContext'

function QrPlaceholder({ size = 200 }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 20,
        background: '#fff',
        border: '1px dashed #c2cad6',
        color: '#9aa5b5',
      }}
    >
      <div className="text-center">
        <QrCode size={48} style={{ margin: '0 auto 8px' }} />
        <div style={{ fontSize: 13 }}>QR Code</div>
      </div>
    </div>
  )
}

export default function QrVerification() {
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleVerify = () => {
    if (!code.trim()) {
      toast.warning('Code required', 'Enter the verification code printed on your marksheet.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setVerified(true)
      toast.success('Success', 'Result authenticity verified. This marksheet is genuine.')
    }, 800)
  }

  return (
    <div>
      <PageHeader
        title="QR Verification"
        subtitle="Verify the authenticity of any Examora marksheet by scanning its QR code."
      />

      <div className="grid grid-detail">
        <Card padded className="text-center">
          <QrPlaceholder />
          <div className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
            Scan a printed Examora marksheet QR code using your device scanner to verify authenticity.
          </div>
        </Card>

        <Card padded>
          <h3 className="card-title mb-2">Verify a Marksheet</h3>
          <p className="muted mb-4" style={{ fontSize: 13.5 }}>
            Enter the verification code embedded in the QR code of a marksheet. The backend verifies against
            the officially published result record.
          </p>

          {!verified ? (
            <>
              <Input
                label="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. EXAM-8F3A-2026"
                hint="Also printed below the QR code on the official marksheet."
              />
              <Button onClick={handleVerify} loading={loading}>
                <QrCode size={16} /> Verify Code
              </Button>
            </>
          ) : (
            <div className="state-block">
              <div className="state-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                <CheckCircle2 size={30} />
              </div>
              <div className="state-title">Marksheet Verified</div>
              <div className="state-desc">
                Code <Badge variant="primary">{code}</Badge> corresponds to an authentic published result.
                The document has not been tampered with.
              </div>
              <Button variant="outline" onClick={() => { setVerified(false); setCode('') }}>
                Verify another
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}