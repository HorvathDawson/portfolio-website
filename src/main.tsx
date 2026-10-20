import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// The A40 build log pulls in marked, KaTeX and ~150 KB of roadmap data, so it
// is split into its own chunks and only downloaded when a blog route is visited.
const A40Blog = lazy(() => import('./blog/A40Blog.tsx').then((m) => ({ default: m.A40Blog })))
const A40Roadmap = lazy(() => import('./blog/A40Roadmap.tsx').then((m) => ({ default: m.A40Roadmap })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/a40" element={<A40Blog />} />
          <Route path="/a40/roadmap" element={<A40Roadmap />} />
          <Route path="/a40/:slug" element={<A40Blog />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
