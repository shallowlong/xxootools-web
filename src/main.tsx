import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/theme-provider'
// 导入i18n配置
import './lib/i18n'
// 导入 PWA 注册函数
import { registerServiceWorker } from './pwa'

// 注册 Service Worker
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider defaultTheme="system" storageKey="xxootools-theme">
        <App />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
