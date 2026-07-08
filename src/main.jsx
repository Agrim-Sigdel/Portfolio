import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './shared/styles/theme.css'
import App from './App.jsx'
import { ThemeProvider } from './shared/lib/ThemeContext'

// framer-motion is intentionally NOT imported here. It's pulled in lazily by the
// mode pages (via MotionProvider) so the ~136 kB motion chunk stays off the
// landing page's critical path — the selector doesn't animate with it.
createRoot(document.getElementById('root')).render(

    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>

)
