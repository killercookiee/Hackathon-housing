"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "anthropic_api_key"
const CHANGE_EVENT = "anthropic-api-key-changed"

export function useAnthropicKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setApiKeyState(localStorage.getItem(STORAGE_KEY))
    setLoaded(true)

    // Multiple components use this hook independently. Since each has its
    // own React state, a save/clear in one (e.g. the API key dialog) needs
    // to be broadcast so others (e.g. the workspace) pick it up without a
    // full page reload.
    const syncFromStorage = () => setApiKeyState(localStorage.getItem(STORAGE_KEY))
    window.addEventListener("storage", syncFromStorage)
    window.addEventListener(CHANGE_EVENT, syncFromStorage)
    return () => {
      window.removeEventListener("storage", syncFromStorage)
      window.removeEventListener(CHANGE_EVENT, syncFromStorage)
    }
  }, [])

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key)
    setApiKeyState(key)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState(null)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { apiKey, setApiKey, clearApiKey, loaded }
}
