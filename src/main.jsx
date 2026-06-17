import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './shared/styles/theme.css'
import App from './App.jsx'
import { ThemeProvider } from './shared/lib/ThemeContext'

createRoot(document.getElementById('root')).render(

    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>

)
