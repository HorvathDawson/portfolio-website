/* Dev-only preview of GarageScene, mounted by scene-preview.html via
   src/scenePreview.tsx. Not part of the production build. */
import { useState } from 'react'
import '../App.css'
import './blogStyles.css'
import { GarageScene } from './GarageScene'
import { carTransitionName, returningCar } from './garageSceneTransition'
import { cars, getCar } from './cars'

/** Stand-in for the car's log: just the sidebar thumbnail the car morphs into. */
function FakeLog({ id, onBack }: { id: string; onBack: () => void }) {
  const car = getCar(id)!
  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <aside style={{ width: 220, borderRight: '1px solid #fff3', paddingRight: 16 }}>
        <img src={car.art.outline} alt="" width={64} height={36}
          style={{ objectFit: 'contain', viewTransitionName: carTransitionName(id) }} />
        <p>{car.logTitle}</p>
      </aside>
      <main>
        <h1 data-testid="log">{car.logTitle}</h1>
        <button onClick={onBack}>&larr; Garage</button>
      </main>
    </div>
  )
}

export function GarageScenePreview() {
  const [log, setLog] = useState<string | null>(null)
  const [back, setBack] = useState<string | undefined>(() => new URLSearchParams(location.search).get('returning') ?? returningCar())
  const goBack = () => {
    const id = log
    const swap = () => { setBack(id ?? undefined); setLog(null) }
    if (document.startViewTransition) document.startViewTransition(swap)
    else swap()
  }
  return (
    <div className="blog-page" style={{ padding: '24px 16px', boxSizing: 'border-box' }}>
      {log ? <FakeLog id={log} onBack={goBack} /> : (
        <GarageScene cars={cars} returning={back} onReturned={() => setBack(undefined)} onEnter={(id) => setLog(id)} />
      )}
    </div>
  )
}
