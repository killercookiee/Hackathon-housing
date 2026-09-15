"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "anthropic_api_key"

export function useAnthropicKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setApiKeyState(localStorage.getItem(STORAGE_KEY))
    setLoaded(true)
  }, [])

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key)
    setApiKeyState(key)
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState(null)
  }, [])

  return { apiKey, setApiKey, clearApiKey, loaded }
}
