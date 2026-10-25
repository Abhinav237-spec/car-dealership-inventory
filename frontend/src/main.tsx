import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// Archivo is a variable font: its width axis (wdth) gives us both the wide display
// lettering and the regular body text from one family. Self-hosted, so no third-party requests.
import '@fontsource-variable/archivo/wdth.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
