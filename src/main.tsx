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
// 导入FFmpeg管理器
import FFmpegManager from './lib/ffmpeg'

// 预加载FFmpeg (不等待加载完成，不阻塞应用渲染)
FFmpegManager.preload();

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
