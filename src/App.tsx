import './App.css'
import { Routes, Route } from 'react-router-dom'
import RootLayout from './components/layout/RootLayout'
import { lazy, Suspense } from 'react'

// 懒加载工具页面
const Home = lazy(() => import('./pages/Home'))
const TextConverter = lazy(() => import('./pages/tools/TextConverter'))
const TextDiff = lazy(() => import('./pages/tools/TextDiff'))
const ImageCompress = lazy(() => import('./pages/tools/ImageCompress'))
const ImageConverter = lazy(() => import('./pages/tools/ImageConverter'))
const VideoCompress = lazy(() => import('./pages/tools/VideoCompress'))
const AudioConverter = lazy(() => import('./pages/tools/AudioConverter'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={
          <Suspense fallback={<div>加载中...</div>}>
            <Home />
          </Suspense>
        } />
        <Route path="tools">
          <Route path="text-converter" element={
            <Suspense fallback={<div>加载中...</div>}>
              <TextConverter />
            </Suspense>
          } />
          <Route path="text-diff" element={
            <Suspense fallback={<div>加载中...</div>}>
              <TextDiff />
            </Suspense>
          } />
          <Route path="image-compress" element={
            <Suspense fallback={<div>加载中...</div>}>
              <ImageCompress />
            </Suspense>
          } />
          <Route path="image-converter" element={
            <Suspense fallback={<div>加载中...</div>}>
              <ImageConverter />
            </Suspense>
          } />
          <Route path="video-compress" element={
            <Suspense fallback={<div>加载中...</div>}>
              <VideoCompress />
            </Suspense>
          } />
          <Route path="audio-converter" element={
            <Suspense fallback={<div>加载中...</div>}>
              <AudioConverter />
            </Suspense>
          } />
        </Route>
        <Route path="*" element={
          <Suspense fallback={<div>加载中...</div>}>
            <NotFound />
          </Suspense>
        } />
      </Route>
    </Routes>
  )
}

export default App
