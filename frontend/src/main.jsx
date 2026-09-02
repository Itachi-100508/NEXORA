import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/auth.css'
import './styles/layout.css'
import App from './App.jsx'
import { applyThemeAttributes, getInitialTheme, getInitialAccent } from './context/ThemeContext'

applyThemeAttributes(getInitialTheme(), getInitialAccent())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)