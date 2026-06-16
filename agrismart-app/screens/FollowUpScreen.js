import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { useApp } from '../context/AppContext'
import { useFocusReplay } from '../hooks/useFocusReplay'
import { getCrop } from '../data/crops'
import { getAllAnomalies, resolveAnomaly, setAnomalyMonitoring } from '../db/repo'
import { analyzeInspection } from '../api/sensors'
import { isResolved } from '../logic/stageMachine'
import { pickPlantImage } from '../logic/capture'
import { Alert } from 'react-native'
import { colors, type, radius, space } from '../theme'
import Hero from '../components/ui/Hero'
import SectionHeader from '../components/ui/SectionHeader'
import AnomalyCard from '../components/AnomalyCard'

export default function FollowUpScreen({ navigation }) {
  const { profile, currentStage } = useApp()
  const replayKey = useFocusReplay()
  const crop = profile ? getCrop(profile.crop_type) : null
  const [anomalies, setAnomalies] = useState([])
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (currentStage) setAnomalies(await getAllAnomalies(currentStage.id))
  }, [currentStage])

  // Reload when the screen mounts/stage changes AND every time the tab gains focus
  useEffect(() => {
    reload()
    const unsub = navigation?.addListener('focus', reload)
    return unsub
  }, [reload, navigation])

  const handleResolve = async (anomaly) => {
    const asset = await pickPlantImage()
    if (!asset?.base64) return
    setBusy(true)
    try {
      const v = await analyzeInspection({
        mode: 'resolution',
        imageBase64: asset.base64,
        cropType: crop?.label,
        variety: profile?.variety,
        stageKey: currentStage?.label,
        anomalyType: anomaly.type,
      })
      if (isResolved(v)) {
        await resolveAnomaly(anomaly.id, asset.uri)
        Alert.alert('Anomalie résolue', v.note || "L'IA confirme que le problème est résolu.")
      } else {
        // Not resolved yet → mark as under monitoring
        await setAnomalyMonitoring(anomaly.id)
        Alert.alert('Pas encore résolue', v.note || "L'IA estime que l'anomalie est toujours présente. Continue le traitement et réessaie.")
      }
      await reload()
    } catch (e) {
      Alert.alert('Vérification impossible', "L'analyse n'a pas pu aboutir. Vérifie la connexion au serveur et réessaie avec une photo nette du plant.")
    } finally {
      setBusy(false)
    }
  }

  const open = anomalies.filter((a) => a.status !== 'resolved')
  const resolved = anomalies.filter((a) => a.status === 'resolved')

  return (
    <View style={styles.screen} key={replayKey}>
      <Hero eyebrow="Suivi sanitaire" title="Anomalies" subtitle={`Stade en cours · ${currentStage?.label ?? '—'}`} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {busy ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} /> : null}

        <SectionHeader title={`À résoudre · ${open.length}`} />
        {open.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={styles.emptyText}>Aucune anomalie active. Tu peux valider le stade.</Text>
          </View>
        ) : (
          open.map((a, i) => (
            <AnomalyCard
              key={a.id}
              anomaly={a}
              onResolve={handleResolve}
              onPress={() => navigation.navigate('AnomalyDetail', { anomalyId: a.id })}
              index={i}
            />
          ))
        )}

        {resolved.length > 0 ? (
          <>
            <SectionHeader title={`Résolues · ${resolved.length}`} />
            {resolved.map((a, i) => (
              <AnomalyCard
                key={a.id}
                anomaly={a}
                onPress={() => navigation.navigate('AnomalyDetail', { anomalyId: a.id })}
                index={i}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: 110 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successBg, padding: 15, borderRadius: radius.md },
  emptyText: { ...type.bodyMed, color: colors.success, flex: 1 },
})
