import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'

// Returns a number that increments every time the screen gains focus.
// Use it as a `key` on the content you want to re-mount so Reanimated `entering`
// animations replay on each visit (not just the first mount).
export function useFocusReplay() {
  const [key, setKey] = useState(0)
  useFocusEffect(
    useCallback(() => {
      setKey((k) => k + 1)
    }, [])
  )
  return key
}
