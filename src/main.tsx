import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import App from './App.tsx'
import { NotFound } from './components/NotFound.tsx'
import { LegacyRedirect } from './components/LegacyRedirect.tsx'

// The garage pulls in marked, KaTeX and ~150 KB of roadmap data, so each page
// is split into its own chunk and only downloaded when a garage route is
// visited. Post bodies are split further, one chunk per post (see cars.ts).
const GarageSelector = lazy(() => import('./blog/GarageSelector.tsx').then((m) => ({ default: m.GarageSelector })))
const GarageBlog = lazy(() => import('./blog/GarageBlog.tsx').then((m) => ({ default: m.GarageBlog })))
const CarRoadmap = lazy(() => import('./blog/A40RoadmapViews.tsx').then((m) => ({ default: m.CarRoadmap })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/garage" element={<GarageSelector />} />
          <Route path="/garage/:car" element={<GarageBlog />} />
          <Route path="/garage/:car/roadmap" element={<CarRoadmap />} />
          <Route path="/garage/:car/:slug" element={<GarageBlog />} />
          <Route path="/a40/*" element={<LegacyRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
