import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('EXAMORA runtime error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <div className="error-card">
            <div className="state-icon error" style={{ margin: '0 auto 16px', width: 72, height: 72 }}>
              <AlertTriangle size={34} />
            </div>
            <h1 className="error-title">Something went wrong</h1>
            <p className="error-desc">An unexpected error occurred while rendering this screen. Your data is safe — you can try reloading.</p>
            <div className="flex" style={{ gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={this.handleReset}>
                <RotateCcw size={16} /> Try again
              </button>
              <button className="btn btn-outline" onClick={() => window.location.reload()}>Reload page</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary