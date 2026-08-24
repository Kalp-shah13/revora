import { useEffect, useCallback, useRef } from 'react'

/**
 * Calls the provided callback on a regular interval.
 * Cleans up on unmount. Pauses when the tab is hidden.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30_000) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  const tick = useCallback(() => {
    // Don't refresh if the tab is hidden — avoids unnecessary requests
    if (document.visibilityState === 'visible') {
      savedCallback.current()
    }
  }, [])

  useEffect(() => {
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [tick, intervalMs])
}
