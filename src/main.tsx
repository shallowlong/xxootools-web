import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/theme-provider'
// 导入i18n配置
import './lib/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="xxootools-theme">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
