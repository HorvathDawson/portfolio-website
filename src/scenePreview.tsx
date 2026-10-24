/* Dev-only entry for scene-preview.html (open /scene-preview.html under `npx vite`).
   Not part of the production build: index.html is the only build input. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GarageScenePreview } from './blog/GarageScenePreview'

createRoot(document.getElementById('root')!).render(<StrictMode><GarageScenePreview /></StrictMode>)
