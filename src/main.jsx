import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import SkillClone from './SkillClone'

const Scene3D = lazy(() => import('./scene/Scene3D'))
const CatDebug = lazy(() => import('./CatDebug'))

function App() {
  const path = window.location.pathname
  if (path === '/3d') return <Suspense fallback={<div style={{ background: '#0a0a0f', width: '100vw', height: '100vh' }} />}><Scene3D /></Suspense>
  if (path === '/cat') return <Suspense fallback={<div style={{ background: '#1a1a2e', width: '100vw', height: '100vh' }} />}><CatDebug /></Suspense>
  return <SkillClone />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
