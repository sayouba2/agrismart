import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { useApp } from '../context/AppContext'
import { useFocusReplay } from '../hooks/useFocusReplay'
import { getCrop } from '../data/crops'
import { openAnomaliesForStage } from '../db/repo'
import { colors, type, radius, space } from '../theme'
import Hero from '../components/ui/Hero'
import Card from '../components/ui/Card'
import StageStepper from '../components/StageStepper'

export default function JourneyScreen({ navigation }) {
  const { profile, stages, currentStage, refresh } = useApp()
  const replayKey = useFocusReplay()
  const crop = profile ? getCrop(profile.crop_type) : null
  const [openCount, setOpenCount] = useState(0)

  const reload = useCallback(async () => {
    await refresh()
    if (currentStage) setOpenCount((await openAnomaliesForStage(currentStage.id)).length)
  }, [refresh, currentStage])

  useEffect(() => {
    const unsub = navigation.addListener('focus', reload)
    return unsub
  }, [navigation, reload])

  const doneCount = stages.filter((s) => s.status === 'done').length
  const progress = stages.length ? doneCount / stages.length : 0

  return (
    <View style={styles.screen} key={replayKey}>
      <Hero eyebrow="Suivi de croissance" title="Parcours de culture" subtitle={`${crop?.label ?? ''} · ${doneCount}/${stages.length} stades validés`}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 4)}%` }]} />
        </View>
      </Hero>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {openCount > 0 ? (
          <View style={styles.warn}>
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Text style={styles.warnText}>
              {openCount} anomalie(s) à résoudre sur « {currentStage?.label} » avant de continuer.
            </Text>
          </View>
        ) : null}

        <Card>
          <StageStepper stages={stages} onPressStage={(s) => navigation.navigate('Inspection', { stageId: s.id })} />
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 110 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 16, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: colors.white },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.warningBg, borderRadius: radius.md, padding: 13, marginBottom: 12 },
  warnText: { ...type.caption, color: colors.warning, flex: 1 },
})
