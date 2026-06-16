import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { initDb, resetDb } from '../db/schema'
import { getProfile, getProfiles, getCurrentStage, getStages, setActiveProfile, deleteProfile } from '../db/repo'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false) // DB initialized?
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [stages, setStages] = useState([])
  const [currentStage, setCurrentStage] = useState(null)

  // Reload the active profile, the list of cultures and the stages.
  const refresh = useCallback(async () => {
    setProfiles(await getProfiles())
    const p = await getProfile()
    setProfile(p)
    if (p) {
      setStages(await getStages(p.id))
      setCurrentStage(await getCurrentStage(p))
    } else {
      setStages([])
      setCurrentStage(null)
    }
  }, [])

  // Switch the active culture.
  const switchProfile = useCallback(
    async (id) => {
      await setActiveProfile(id)
      await refresh()
    },
    [refresh]
  )

  // Delete a culture (and its data).
  const removeProfile = useCallback(
    async (id) => {
      await deleteProfile(id)
      await refresh()
    },
    [refresh]
  )

  useEffect(() => {
    ;(async () => {
      await initDb()
      await refresh()
      setReady(true)
    })()
  }, [refresh])

  const reset = useCallback(async () => {
    await resetDb()
    await refresh()
  }, [refresh])

  const value = {
    ready,
    profile,
    profiles,
    stages,
    currentStage,
    hasProfile: !!profile,
    refresh,
    switchProfile,
    removeProfile,
    reset,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
