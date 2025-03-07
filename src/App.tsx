import './App.css'
import { Routes, Route } from 'react-router-dom'
import RootLayout from './components/layout/RootLayout'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

// 懒加载工具页面
const Home = lazy(() => import('./pages/Home'))
const TextConverter = lazy(() => import('./pages/text/TextConverter'))
const TextDiff = lazy(() => import('./pages/text/TextDiff'))
const ImageCompress = lazy(() => import('./pages/image/ImageCompress'))
const ImageConverter = lazy(() => import('./pages/image/ImageConverter'))
const VideoCompress = lazy(() => import('./pages/video/VideoCompress'))
const AudioConverter = lazy(() => import('./pages/audio/AudioConverter'))
const WordCount = lazy(() => import('./pages/writer/WordCount'))
const Privacy = lazy(() => import('./pages/Privacy'))
const NotFound = lazy(() => import('./pages/NotFound'))


function App() {
  const { t } = useTranslation();
  
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <Home />
          </Suspense>
        } />
        <Route path="text">
          <Route path="text-converter" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <TextConverter />
            </Suspense>
          } />
          <Route path="text-diff" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <TextDiff />
            </Suspense>
          } />
        </Route>
        <Route path="image">
          <Route path="image-compress" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <ImageCompress />
            </Suspense>
          } />
          <Route path="image-converter" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <ImageConverter />
            </Suspense>
          } />
        </Route>
        <Route path="video">
          <Route path="video-compress" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <VideoCompress />
            </Suspense>
          } />
        </Route>
        <Route path="audio">
          <Route path="audio-converter" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <AudioConverter />
            </Suspense>
          } />
        </Route>
        <Route path="writer">
          <Route path="word-count" element={
            <Suspense fallback={<div>{t('common.loading')}</div>}>
              <WordCount />
            </Suspense>
          } />
        </Route>
        <Route path="privacy" element={
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <Privacy />
          </Suspense>
        } />
        <Route path="*" element={
          <Suspense fallback={<div>{t('common.loading')}</div>}>
            <NotFound />
          </Suspense>
        } />
      </Route>
    </Routes>
  )
}

export default App
