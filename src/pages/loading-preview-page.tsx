import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlatformLoadingScreen } from '@/components/platform-loading-screen'

export default function LoadingPreviewPage() {
  const [playing, setPlaying] = useState(true)
  return <main className="omega-loading-preview">
    <div><h1>Prévia do loading Omega</h1><p>A mesma entrada do site, com mais tempo para observar.</p>
      <div className="omega-loading-preview-actions"><button type="button" onClick={() => setPlaying(true)}>Rever loading</button><Link to="/landing">Abrir o site</Link></div>
    </div>
    {playing && <PlatformLoadingScreen contentReady minimumDuration={5200} onComplete={() => setPlaying(false)} />}
  </main>
}
