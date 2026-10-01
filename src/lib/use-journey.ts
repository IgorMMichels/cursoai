import { useEffect, useState } from 'react'
import { loadJourneys, type Journey } from '@/lib/journeys'

export function useJourney(journeyId?: string) {
  const [journey, setJourney] = useState<Journey | null>(null)
  const [loading, setLoading] = useState(Boolean(journeyId))
  const [error, setError] = useState('')
  useEffect(() => {
    if (!journeyId) return
    let active = true
    loadJourneys().then((items) => {
      if (active) setJourney(items.find((item) => item.id === journeyId) ?? null)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a jornada.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [journeyId])
  return { journey, loading, error }
}
