// src/hooks/use-catalog-suggestions.ts
// Debounced suggestions from local item catalog (200ms).
// NOT reactive via useLiveQuery — catalog query is on-demand derivation, not subscription.

import { useEffect, useState } from 'react'
import type { CatalogItem } from '@/db/types'
import { catalogService } from '@/services/catalog-service'

const DEBOUNCE_MS = 200

export type UseCatalogSuggestionsResult = {
  suggestions: CatalogItem[]
  isLoading: boolean
}

export function useCatalogSuggestions(query: string, limit = 5): UseCatalogSuggestionsResult {
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const handle = window.setTimeout(() => {
      void (async () => {
        const result = await catalogService.getSuggestions(query, limit)
        if (result.data) setSuggestions(result.data)
        setIsLoading(false)
      })()
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(handle)
    }
  }, [query, limit])

  return { suggestions, isLoading }
}
