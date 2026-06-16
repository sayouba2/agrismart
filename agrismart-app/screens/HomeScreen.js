import { useEffect, useState, useCallback, useRef } from 'react'
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { fetchSensors, fetchRecommendations } from '../api/sensors'
import { evaluateAlerts } from '../logic/alerts'
import { POLL_INTERVAL } from '../config'
import { useApp } from '../context/AppContext'
import { useFocusReplay } from '../hooks/useFocusReplay'
import { getCrop } from '../data/crops'
import { getRegion } from '../data/regions'
import { buildAgroContext } from '../logic/agroContext'
import { openAnomaliesForStage } from '../db/repo'
import { colors, type, radius, space } from '../theme'
import Hero from '../components/ui/Hero'
import LiveDot from '../components/ui/LiveDot'
import PressableScale from '../components/ui/PressableScale'
import SensorCard from '../components/SensorCard'
import AlertBanner from '../components/AlertBanner'
import Recommendations from '../components/Recommendations'
import WeatherCard from '../components/WeatherCard'
import HistoryCard from '../components/HistoryCard'

export default function HomeScreen({ navigation }) {
  const { profile, currentStage } = useApp()
  const replayKey = useFocusReplay()
  const crop = profile ? getCrop(profile.crop_type) : null
  const region = profile ? getRegion(profile.region) : null

  const [data, setData] = useState(null)
  const [netError, setNetError] = useState(null)
  const [openCount, setOpenCount] = useState(0)

  const [tips, setTips] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  const dataRef = useRef(null)
  dataRef.current = data

  const load = useCallback(async () => {
    try {
      const json = await fetchSensors()
      setData(json)
      setNetError(null)
    } catch (e) {
      setNetError("Serveur injoignable. Vérifie le WiFi et l'IP dans config.js.")
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      if (currentStage) setOpenCount((await openAnomaliesForStage(currentStage.id)).length)
    })
    if (currentStage) openAnomaliesForStage(currentStage.id).then((a) => setOpenCount(a.length))
    return unsub
  }, [navigation, currentStage])

  const getAdvice = useCallback(async () => {
    const current = dataRef.current
    if (!current || current.temperature == null) {
      setAiError('Pas encore de données capteurs.')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetchRecommendations({
        temperature: current.temperature,
        humidity: current.humidity,
        ...buildAgroContext(profile),
      })
      setTips(res.tips ?? [])
    } catch (e) {
      setAiError('Échec IA. Vérifie la clé OpenAI sur le serveur.')
    } finally {
      setAiLoading(false)
    }
  }, [profile])

  const alerts = evaluateAlerts(data)
  const connected = data?.connected
  const hasWarning = openCount > 0

  return (
    <View style={styles.screen} key={replayKey}>
      <Hero
        eyebrow="Tableau de bord"
        title={`${crop?.label ?? 'Ma culture'}`}
        right={
          <View style={styles.liveChip}>
            <LiveDot active={connected} />
            <Text style={styles.liveText}>{connected ? 'En direct' : 'Hors ligne'}</Text>
          </View>
        }
      >
        <PressableScale onPress={() => navigation.navigate('Parcours')} style={[styles.stageCta, hasWarning && styles.stageCtaWarn]}>
          <View style={styles.stageIcon}>
            <Feather name={hasWarning ? 'alert-triangle' : 'navigation'} size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stageEyebrow}>Stade en cours</Text>
            <Text style={styles.stageName}>{currentStage?.label ?? '—'}</Text>
          </View>
          <Text style={styles.stageAction}>
            {hasWarning ? `${openCount} à suivre` : 'Inspecter'}
          </Text>
          <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.85)" />
        </PressableScale>
      </Hero>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
      >
        {netError ? (
          <View style={styles.netError}>
            <Feather name="wifi-off" size={15} color={colors.danger} />
            <Text style={styles.netErrorText}>{netError}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <SensorCard label="Température" icon="thermometer" value={data?.temperature} unit="°C" range={data?.thresholds?.temperature} index={0} />
          <SensorCard label="Humidité" icon="droplet" value={data?.humidity} unit="%" range={data?.thresholds?.humidity} index={1} />
        </View>

        <AlertBanner alerts={alerts} />
        <WeatherCard region={region} />
        <Recommendations tips={tips} loading={aiLoading} error={aiError} onRefresh={getAdvice} />
        <HistoryCard />

        <Text style={styles.footer}>
          {connected ? `Mise à jour ${data?.lastUpdate ?? ''}` : 'Capteur hors ligne'} · toutes les {POLL_INTERVAL / 1000}s
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.sm, paddingBottom: 110 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.pill },
  liveText: { ...type.caption, color: colors.white },
  stageCta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.lg, padding: 14, marginTop: 18 },
  stageCtaWarn: { backgroundColor: 'rgba(207,67,57,0.30)' },
  stageIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  stageEyebrow: { ...type.overline, color: 'rgba(255,255,255,0.7)' },
  stageName: { ...type.title, color: colors.white, marginTop: 1 },
  stageAction: { ...type.caption, color: colors.white },
  row: { flexDirection: 'row', marginTop: 6 },
  netError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerBg, padding: 12, borderRadius: radius.md, margin: 6 },
  netErrorText: { ...type.caption, color: colors.danger, flex: 1 },
  footer: { ...type.caption, textAlign: 'center', color: colors.textFaint, marginTop: 18 },
})
