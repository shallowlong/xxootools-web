import './App.css'
import { Routes, Route } from 'react-router-dom'
import RootLayout from './components/layout/RootLayout'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from './components/ui/toaster'

// 懒加载工具页面
const Home = lazy(() => import('./pages/Home'))
const TextConverter = lazy(() => import('./pages/text/TextConverter'))
const TextDiff = lazy(() => import('./pages/text/TextDiff'))
const ImageCompress = lazy(() => import('./pages/image/ImageCompress'))
const ImageConverter = lazy(() => import('./pages/image/ImageConverter'))
const ImageRemoveBg = lazy(() => import('./pages/image/ImageRemoveBg'))
const ImageMosaic = lazy(() => import('./pages/image/ImageMosaic'))

const VideoCompress = lazy(() => import('./pages/video/VideoCompress'))
const AudioConverter = lazy(() => import('./pages/audio/AudioConverter'))
const WordCount = lazy(() => import('./pages/writer/WordCount'))
const DayjsUtils = lazy(() => import('./pages/date/DayjsUtils'))
const MomentUtils = lazy(() => import('./pages/date/MomentUtils'))
const DateUtils = lazy(() => import('./pages/date/DateUtils'))
const Privacy = lazy(() => import('./pages/Privacy'))
const NotFound = lazy(() => import('./pages/NotFound'))
const SVGPreview = lazy(() => import('./pages/svg/SVGPreview'))
const SVGToPNG = lazy(() => import('./pages/svg/SVGToPNG'))
const SVGToJPG = lazy(() => import('./pages/svg/SVGToJPG'))
const SVGToPDF = lazy(() => import('./pages/svg/SVGToPDF'))
const PNGToSVG = lazy(() => import('./pages/svg/PNGToSVG'))
const JPGToSVG = lazy(() => import('./pages/svg/JPGToSVG'))
const SVGOptimizer = lazy(() => import('./pages/svg/SVGOptimizer'))


function App() {
  const { t } = useTranslation();
  
  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">{t('common.loading')}</div>}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="text">
              <Route path="text-converter" element={<TextConverter />} />
              <Route path="text-diff" element={<TextDiff />} />
            </Route>
            <Route path="image">
              <Route path="image-compress" element={<ImageCompress />} />
              <Route path="image-converter" element={<ImageConverter />} />
              <Route path="image-removebg" element={<ImageRemoveBg />} />
              <Route path="image-mosaic" element={<ImageMosaic />} />
            </Route>
            <Route path="svg">
              <Route path="svg-preview" element={<SVGPreview />} />
              <Route path="svg-to-png" element={<SVGToPNG />} />
              <Route path="svg-to-jpg" element={<SVGToJPG />} />
              <Route path="svg-to-pdf" element={<SVGToPDF />} />
              <Route path="png-to-svg" element={<PNGToSVG />} />
              <Route path="jpg-to-svg" element={<JPGToSVG />} />
              <Route path="svg-optimizer" element={<SVGOptimizer />} />
            </Route>
            <Route path="video">
              <Route path="video-compress" element={<VideoCompress />} />
            </Route>
            <Route path="audio">
              <Route path="audio-converter" element={<AudioConverter />} />
            </Route>
            <Route path="writer">
              <Route path="word-count" element={<WordCount />} />
            </Route>
            <Route path="date">
              <Route path="dayjs-utils" element={<DayjsUtils />} />
              <Route path="moment-utils" element={<MomentUtils />} />
              <Route path="date-utils" element={<DateUtils />} />
            </Route>
            <Route path="privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}

export default App
