import { translateUi } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useState } from 'react'
import { LocalizedLink as Link } from '@/components/localized-router'
import { PlatformLoadingScreen } from '@/components/platform-loading-screen'

export default function LoadingPreviewPage() {
  useUiTranslation();
  const [playing, setPlaying] = useState(true)
  return <main className="omega-loading-preview">
    <div><h1>{translateUi("Prévia do loading Omega")}</h1><p>{translateUi("A mesma entrada do site, com mais tempo para observar.")}</p>
      <div className="omega-loading-preview-actions"><button type="button" onClick={() => setPlaying(true)}>{translateUi("Rever loading")}</button><Link to="/landing">{translateUi("Abrir o site")}</Link></div>
    </div>
    {playing && <PlatformLoadingScreen contentReady minimumDuration={5200} onComplete={() => setPlaying(false)} />}
  </main>
}
