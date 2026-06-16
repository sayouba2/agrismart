import { useEffect, useState, useCallback, useRef } from 'react'
import { ScrollView, View, Text, Image, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as Speech from 'expo-speech'
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'

import { useApp } from '../context/AppContext'
import { getCrop } from '../data/crops'
import { getAnomaly, getInspection, saveAnomalyDetails } from '../db/repo'
import { fetchAnomalyDetails, fetchTts } from '../api/sensors'
import { buildAgroContext } from '../logic/agroContext'
import { colors, type, radius, space, shadow } from '../theme'
import Hero from '../components/ui/Hero'
import Pill from '../components/ui/Pill'
import Button from '../components/ui/Button'
import PressableScale from '../components/ui/PressableScale'

const SEVERITY_TONE = { faible: 'warning', moyenne: 'warning', 'élevée': 'danger', elevée: 'danger' }

function Section({ icon, title, items }) {
  if (!items?.length) return null
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Feather name={icon} size={16} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={styles.itemRow}>
          <View style={styles.bullet} />
          <Text style={styles.itemText}>{it}</Text>
        </View>
      ))}
    </View>
  )
}

export default function AnomalyDetailScreen({ route, navigation }) {
  const { profile, stages } = useApp()
  const anomalyId = route.params?.anomalyId

  const [anomaly, setAnomaly] = useState(null)
  const [inspection, setInspection] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [speaking, setSpeaking] = useState(false)
  const [audioBusy, setAudioBusy] = useState(false)
  const playerRef = useRef(null)
  const ttsUri = `${FileSystem.cacheDirectory}tts_${anomalyId}.mp3`

  // Parse the original verdict to recover the AI's description + health
  const verdict = (() => {
    try {
      return inspection?.verdict_json ? JSON.parse(inspection.verdict_json) : null
    } catch {
      return null
    }
  })()
  const stage = anomaly ? stages.find((s) => s.id === anomaly.stage_id) : null

  // force = true regenerates even if a cached explanation exists
  const load = useCallback(
    async (force = false) => {
      setLoading(true)
      setError(null)
      // Regenerating invalidates the cached voice-over too
      if (force) {
        try { await FileSystem.deleteAsync(ttsUri, { idempotent: true }) } catch {}
      }
      try {
        const a = await getAnomaly(anomalyId)
        setAnomaly(a)
        const insp = a?.inspection_id ? await getInspection(a.inspection_id) : null
        setInspection(insp)

        // Use the cached explanation if we have one (avoids re-calling the AI)
        if (!force && a?.details_json) {
          try {
            setDetails(JSON.parse(a.details_json))
            setLoading(false)
            return
          } catch {}
        }

        let v = null
        try {
          v = insp?.verdict_json ? JSON.parse(insp.verdict_json) : null
        } catch {}

        const stg = a ? stages.find((s) => s.id === a.stage_id) : null
        const d = await fetchAnomalyDetails({
          anomalyType: a?.type,
          description: v?.anomalie?.description,
          severity: a?.severity,
          stage: stg?.label,
          health: v?.sante || insp?.health,
          ...buildAgroContext(profile),
        })
        setDetails(d)
        await saveAnomalyDetails(anomalyId, d) // cache for next time
      } catch (e) {
        setError("Impossible de charger l'explication. Vérifie la connexion au serveur.")
      } finally {
        setLoading(false)
      }
    },
    [anomalyId, profile, stages]
  )

  useEffect(() => {
    load()
  }, [load])

  // Let audio play even when the iPhone's silent switch is ON, and clean up on exit
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
    return () => {
      try { playerRef.current?.remove() } catch {}
      Speech.stop()
    }
  }, [])

  // Assemble a readable French text for text-to-speech
  const speechText = (() => {
    if (!details) return ''
    const parts = [
      `${anomaly?.type}.`,
      details.resume,
      details.causes?.length ? 'Causes probables. ' + details.causes.join('. ') : '',
      details.symptomes?.length ? 'Symptômes. ' + details.symptomes.join('. ') : '',
      details.traitement?.length ? 'Traitement. ' + details.traitement.join('. ') : '',
      details.prevention?.length ? 'Prévention. ' + details.prevention.join('. ') : '',
    ]
    return parts.filter(Boolean).join(' ')
  })()

  const stopSpeech = () => {
    try { playerRef.current?.pause() } catch {}
    Speech.stop()
    setSpeaking(false)
  }

  // Device TTS fallback (used if ElevenLabs has no key or fails)
  const speakWithDevice = () => {
    Speech.speak(speechText, {
      language: 'fr-FR',
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => {
        setSpeaking(false)
        Alert.alert('Lecture indisponible', "La synthèse vocale n'a pas pu démarrer sur cet appareil.")
      },
    })
    setSpeaking(true)
  }

  const toggleSpeech = async () => {
    if (speaking) return stopSpeech()
    if (!speechText) return

    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})

    // Primary path: realistic ElevenLabs voice, cached on the device
    try {
      setAudioBusy(true)
      const info = await FileSystem.getInfoAsync(ttsUri)
      if (!info.exists) {
        const b64 = await fetchTts(speechText) // throws if no key / network error
        await FileSystem.writeAsStringAsync(ttsUri, b64, { encoding: FileSystem.EncodingType.Base64 })
      }
      try { playerRef.current?.remove() } catch {}
      const player = createAudioPlayer(ttsUri)
      playerRef.current = player
      player.addListener('playbackStatusUpdate', (s) => {
        if (s?.didJustFinish) setSpeaking(false)
      })
      player.play()
      setSpeaking(true)
    } catch (e) {
      // Fallback: device TTS
      speakWithDevice()
    } finally {
      setAudioBusy(false)
    }
  }

  const openResource = (requete) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(requete)}`
    Linking.openURL(url)
  }

  const cropLabel = profile ? getCrop(profile.crop_type)?.label : ''
  const tone = SEVERITY_TONE[(anomaly?.severity || '').toLowerCase()] || 'danger'

  return (
    <View style={styles.screen}>
      <Hero eyebrow="Détail de l'anomalie" title={anomaly?.type ?? 'Anomalie'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {inspection?.photo_uri ? <Image source={{ uri: inspection.photo_uri }} style={styles.photo} /> : null}

        <View style={styles.metaRow}>
          {anomaly?.severity ? <Pill label={`Gravité ${anomaly.severity}`} tone={tone} icon="alert-triangle" /> : null}
          {stage ? <Pill label={stage.label} tone="neutral" icon="git-commit" /> : null}
        </View>

        {verdict?.anomalie?.description ? (
          <Text style={styles.observation}>{verdict.anomalie.description}</Text>
        ) : null}

        {/* Listen button */}
        <Button
          title={audioBusy ? 'Préparation de la voix…' : speaking ? 'Arrêter la lecture' : "Écouter l'explication"}
          icon={speaking ? 'square' : 'volume-2'}
          variant={speaking ? 'danger' : 'secondary'}
          loading={audioBusy}
          onPress={toggleSpeech}
          disabled={loading || !!error}
          style={{ marginTop: 14 }}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>L'IA prépare une explication détaillée…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Réessayer" icon="refresh-cw" variant="secondary" onPress={() => load(true)} style={{ marginTop: 12 }} />
          </View>
        ) : details ? (
          <View style={[styles.card, shadow.card]}>
            {details.resume ? <Text style={styles.resume}>{details.resume}</Text> : null}
            <Section icon="help-circle" title="Causes probables" items={details.causes} />
            <Section icon="eye" title="Symptômes à observer" items={details.symptomes} />
            <Section icon="tool" title="Traitement" items={details.traitement} />
            <Section icon="shield" title="Prévention" items={details.prevention} />

            {/* Web resources */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Feather name="external-link" size={16} color={colors.primary} />
                <Text style={styles.sectionTitle}>Pour aller plus loin</Text>
              </View>
              {(details.ressources?.length
                ? details.ressources
                : [{ titre: `${anomaly?.type} ${cropLabel}`, requete: `${anomaly?.type} ${cropLabel} traitement` }]
              ).map((r, i) => (
                <PressableScale key={i} onPress={() => openResource(r.requete || r.titre)} style={styles.resourceRow}>
                  <Feather name="search" size={15} color={colors.primary} />
                  <Text style={styles.resourceText}>{r.titre}</Text>
                  <Feather name="chevron-right" size={16} color={colors.textFaint} />
                </PressableScale>
              ))}
              <PressableScale
                onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${anomaly?.type} ${cropLabel}`)}`)}
                style={styles.resourceRow}
              >
                <Feather name="youtube" size={15} color={colors.danger} />
                <Text style={styles.resourceText}>Vidéos : {anomaly?.type} ({cropLabel})</Text>
                <Feather name="chevron-right" size={16} color={colors.textFaint} />
              </PressableScale>
            </View>

            <Button title="Régénérer l'explication" icon="refresh-cw" variant="ghost" onPress={() => load(true)} style={{ marginTop: 18 }} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: 140 },
  photo: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  observation: { ...type.body, color: colors.text, marginTop: 12, fontStyle: 'italic' },
  loadingBox: { alignItems: 'center', gap: 10, marginTop: 30 },
  loadingText: { ...type.bodyMed, color: colors.textMuted, textAlign: 'center' },
  errorBox: { marginTop: 20 },
  errorText: { ...type.bodyMed, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginTop: 16, borderWidth: 1, borderColor: colors.border },
  resume: { ...type.body, color: colors.text, marginBottom: 6 },
  section: { marginTop: 18 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { ...type.h2, color: colors.text, fontSize: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 7 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7 },
  itemText: { ...type.body, color: colors.text, flex: 1 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  resourceText: { ...type.bodyMed, color: colors.primary, flex: 1 },
})
