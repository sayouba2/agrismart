import { useState } from 'react'
import { ScrollView, View, Text, Image, StyleSheet, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeIn } from 'react-native-reanimated'

import { useApp } from '../context/AppContext'
import { getCrop, getStageDef } from '../data/crops'
import { fetchSensors, analyzeInspection } from '../api/sensors'
import { addInspection, addAnomaly, openAnomaliesForStage, advanceStage } from '../db/repo'
import { canAdvance, anomaliesFromVerdict } from '../logic/stageMachine'
import { buildAgroContext } from '../logic/agroContext'
import { pickPlantImage } from '../logic/capture'
import { colors, type, radius, space } from '../theme'
import Hero from '../components/ui/Hero'
import Button from '../components/ui/Button'
import VerdictCard from '../components/VerdictCard'

export default function InspectionScreen({ route, navigation }) {
  const { profile, stages, refresh } = useApp()
  const stageId = route.params?.stageId
  const stage = stages.find((s) => s.id === stageId)
  const crop = profile ? getCrop(profile.crop_type) : null
  const stageDef = stage ? getStageDef(profile.crop_type, stage.order_index) : null

  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verdict, setVerdict] = useState(null)
  const [gate, setGate] = useState(null)
  const [analyzed, setAnalyzed] = useState(false) // a photo is analyzed only once

  const choosePhoto = async () => {
    const asset = await pickPlantImage()
    if (asset) {
      setPhoto(asset)
      setVerdict(null)
      setGate(null)
      setAnalyzed(false)
    }
  }

  const analyze = async () => {
    if (!photo?.base64) return Alert.alert('Photo requise', "Ajoute d'abord une photo du plant.")
    if (analyzed || loading) return // guard against re-analyzing the same image
    setLoading(true)
    try {
      // Use the 24h average (not the live 2s reading) so a momentary spike
      // never blocks a stage transition.
      let snapshot = { temperature: null, humidity: null }
      try {
        const s = await fetchSensors()
        const avg = s.avg24h
        snapshot = avg && avg.temperature != null
          ? { temperature: avg.temperature, humidity: avg.humidity }
          : { temperature: s.temperature, humidity: s.humidity }
      } catch {}

      const v = await analyzeInspection({
        mode: 'inspection',
        imageBase64: photo.base64,
        cropType: crop?.label,
        variety: profile?.variety,
        stageKey: stage?.label,
        stageRanges: { temp: stageDef?.temp, hum: stageDef?.hum },
        temperature: snapshot.temperature,
        humidity: snapshot.humidity,
        ...buildAgroContext(profile),
      })
      setVerdict(v)

      const inspectionId = await addInspection(stage.id, {
        photo_uri: photo.uri,
        temperature: snapshot.temperature,
        humidity: snapshot.humidity,
        verdict_json: JSON.stringify(v),
        detected_stage: v.stade_detecte,
        health: v.sante,
        ready_to_advance: v.pret_a_avancer,
      })

      // Create anomalies, but skip any whose type is already open for this stage
      const existing = await openAnomaliesForStage(stage.id)
      const existingTypes = new Set(existing.map((e) => e.type))
      const toCreate = anomaliesFromVerdict(v).filter((a) => !existingTypes.has(a.type))
      for (const a of toCreate) await addAnomaly(stage.id, inspectionId, a)

      setAnalyzed(true) // lock this photo — must pick a new one to analyze again

      const open = await openAnomaliesForStage(stage.id)
      setGate(canAdvance(v, open))

      if (toCreate.length > 0) {
        Alert.alert('Suivi déclenché', "Une anomalie a été détectée. Résous-la dans l'onglet Suivi (photo de confirmation) avant de passer au stade suivant.")
      }
    } catch (e) {
      Alert.alert("Analyse impossible", "L'IA n'a pas pu analyser cette photo. Vérifie la connexion au serveur et réessaie avec une image nette et bien éclairée du plant.")
    } finally {
      setLoading(false)
    }
  }

  const validateStage = async () => {
    const open = await openAnomaliesForStage(stage.id)
    const g = canAdvance(verdict, open)
    if (!g.allowed) {
      setGate(g)
      return Alert.alert('Passage bloqué', g.reason)
    }
    const next = await advanceStage(profile)
    await refresh()
    Alert.alert('Stade validé', next ? `Passage au stade « ${next.label} ».` : 'Le cycle de culture est terminé !')
    navigation.goBack()
  }

  if (!stage) {
    return (
      <View style={styles.center}>
        <Text style={type.body}>Stade introuvable.</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <Hero eyebrow="Inspection" title={stage.label} subtitle="Photographie le plant : l'IA évalue son état et les anomalies." onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {photo ? (
          <Animated.View entering={FadeIn.duration(350)}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <Feather name="camera" size={30} color={colors.textFaint} />
            <Text style={styles.placeholderText}>Aucune photo</Text>
          </View>
        )}

        <Button title={photo ? 'Changer la photo' : 'Ajouter une photo'} icon="image" variant="secondary" onPress={choosePhoto} style={{ marginTop: 14 }} />
        <Button
          title={analyzed ? 'Photo déjà analysée' : "Analyser avec l'IA"}
          icon={analyzed ? 'check' : 'cpu'}
          loading={loading}
          disabled={!photo || analyzed}
          onPress={analyze}
          style={{ marginTop: 10 }}
        />
        {analyzed ? (
          <Text style={styles.analyzedHint}>Change la photo pour lancer une nouvelle analyse.</Text>
        ) : null}

        {verdict ? (
          <View style={{ marginTop: 18 }}>
            <VerdictCard verdict={verdict} />
            {gate && !gate.allowed ? (
              <View style={styles.blocked}>
                <Feather name="lock" size={15} color={colors.warning} />
                <Text style={styles.blockedText}>{gate.reason}</Text>
              </View>
            ) : null}
            {gate?.allowed ? (
              <Button title="Valider le stade et continuer" icon="check-circle" onPress={validateStage} style={{ marginTop: 14 }} />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: 140 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  preview: { width: '100%', height: 280, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  placeholder: { width: '100%', height: 210, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  placeholderText: { ...type.bodyMed, color: colors.textFaint },
  blocked: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warningBg, borderRadius: radius.md, padding: 13, marginTop: 12 },
  blockedText: { ...type.caption, color: colors.warning, flex: 1 },
  analyzedHint: { ...type.caption, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
})
