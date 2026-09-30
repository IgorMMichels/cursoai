import { narrations } from './generated/narrations'
import { welcomeScript } from './narration-script'

export const welcomeNarration = narrations.welcome?.transcript === welcomeScript.transcript
  ? narrations.welcome : undefined
