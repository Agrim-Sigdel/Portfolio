import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import './shared/styles/theme.css'
import App from './App.jsx'
import { ThemeProvider } from './shared/lib/ThemeContext'

createRoot(document.getElementById('root')).render(

    <ThemeProvider>
      <BrowserRouter>
        {/* reducedMotion="user": framer-motion skips transform/layout animations
            for visitors with prefers-reduced-motion, site-wide */}
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </BrowserRouter>
    </ThemeProvider>

)
