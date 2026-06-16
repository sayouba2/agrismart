import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated'

import { CROP_LIST, getCrop, IRRIGATION_TYPES } from '../data/crops'
import { REGIONS, getRegion, getZone } from '../data/regions'
import { SOILS, getSoil } from '../data/soils'
import { createProfile } from '../db/repo'
import { useApp } from '../context/AppContext'
import { colors, type, radius, space, shadow, gradients } from '../theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PressableScale from '../components/ui/PressableScale'
import Button from '../components/ui/Button'

// Ordered conversation steps
const STEPS = ['crop', 'variety', 'region', 'soil', 'planting', 'irrigation', 'area', 'sensor', 'summary']

const DATE_OPTIONS = [
  { label: "Aujourd'hui", days: 0 },
  { label: 'Il y a 1 semaine', days: 7 },
  { label: 'Il y a 2 semaines', days: 14 },
  { label: 'Il y a 1 mois', days: 30 },
]

function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// --- Chat bubbles ------------------------------------------------------------
function BotBubble({ text }) {
  return (
    <Animated.View entering={FadeInUp.duration(320)} style={styles.botRow}>
      <View style={styles.avatar}>
        <Feather name="feather" size={14} color={colors.white} />
      </View>
      <View style={styles.botBubble}>
        <Text style={styles.botText}>{text}</Text>
      </View>
    </Animated.View>
  )
}

function UserBubble({ text }) {
  return (
    <Animated.View entering={FadeInUp.duration(280)} style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </Animated.View>
  )
}

// Generic chip
function Chip({ label, active, onPress }) {
  return (
    <PressableScale onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </PressableScale>
  )
}

export default function OnboardingScreen({ navigation }) {
  const { refresh } = useApp()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef(null)

  const [transcript, setTranscript] = useState([])
  const [step, setStep] = useState('crop')
  const [answers, setAnswers] = useState({})
  const [draft, setDraft] = useState('')
  const [regionQuery, setRegionQuery] = useState('')
  const [showAllSoils, setShowAllSoils] = useState(false)
  const [saving, setSaving] = useState(false)

  const pushBot = (lines) =>
    setTranscript((t) => [...t, ...lines.map((text) => ({ role: 'bot', text }))])
  const pushUser = (text) => setTranscript((t) => [...t, { role: 'user', text }])

  // Build the bot's lines when arriving on a step
  const botLines = (stepId, a) => {
    const crop = a.crop ? getCrop(a.crop) : null
    switch (stepId) {
      case 'crop':
        return ['Salut 👋 Je suis ton assistant AgriSmart.', 'Quelle culture veux-tu suivre cette saison ?']
      case 'variety':
        return crop?.varieties?.length
          ? [`Le ${crop.label}, bon choix !`, 'Quelle variété as-tu semée ?']
          : ['Bonne culture !', "Quelle variété cultives-tu ? (écris « Je ne sais pas » si besoin)"]
      case 'region':
        return ['Dans quelle région es-tu installé ?']
      case 'soil': {
        const r = getRegion(a.region)
        const z = getZone(r?.zone)
        const soil = getSoil(r?.soils?.[0])
        return [
          `${r.name} (ex-${r.oldName}), chef-lieu ${r.chefLieu}.`,
          `Zone ${z.label.toLowerCase()} — ${z.note}`,
          `Sol dominant ici : ${soil.label}. C'est bien le type de sol de ta parcelle ?`,
        ]
      }
      case 'planting':
        return ['Quand as-tu semé ou planté ?']
      case 'irrigation':
        return ['Comment irrigues-tu ta parcelle ?']
      case 'area':
        return ['Quelle surface ou combien de plants ? (optionnel)']
      case 'sensor':
        return ['As-tu un capteur connecté ? Donne son identifiant, ou passe cette étape.']
      case 'summary': {
        const r = getRegion(a.region)
        const soil = getSoil(a.soil)
        return [
          'Parfait, j\'ai tout ce qu\'il me faut ✅',
          `${crop.label}${a.varietyLabel ? ' · ' + a.varietyLabel : ''} · ${r.name} · ${soil.label}. Je prépare ton parcours de culture.`,
        ]
      }
      default:
        return []
    }
  }

  // First bot message on mount
  useEffect(() => {
    pushBot(botLines('crop', {}))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [transcript])

  // Advance helper: record the user's answer, move to next step, show its bot lines
  const advance = (userLabel, patch, fromStep) => {
    const current = fromStep ?? step
    const idx = STEPS.indexOf(current)
    const next = STEPS[idx + 1]
    const nextAnswers = { ...answers, ...patch }
    pushUser(userLabel)
    setAnswers(nextAnswers)
    setDraft('')
    setShowAllSoils(false)
    setRegionQuery('')
    setStep(next)
    setTimeout(() => pushBot(botLines(next, nextAnswers)), 350)
  }

  // --- Final submit ----------------------------------------------------------
  const submit = async () => {
    setSaving(true)
    try {
      await createProfile({
        crop_type: answers.crop,
        variety: answers.varietyLabel || answers.variety || null,
        planting_date: answers.planting_date,
        region: answers.region,
        soil_type: answers.soil,
        irrigation: answers.irrigation,
        area: answers.area,
        sensor_id: answers.sensor,
      })
      await refresh()
      // In "add a culture" mode we're inside a stack → go back to the profile.
      // During first-run onboarding there's nothing to go back to (the root
      // switches to the tabs automatically).
      if (navigation?.canGoBack?.()) navigation.goBack()
    } catch (e) {
      Alert.alert('Erreur', String(e?.message ?? e))
      setSaving(false)
    }
  }

  // --- Input controls per step ----------------------------------------------
  const renderInput = () => {
    switch (step) {
      case 'crop':
        return (
          <View style={styles.cropRow}>
            {CROP_LIST.map((c) => (
              <PressableScale key={c.key} onPress={() => advance(c.label, { crop: c.key })} style={styles.cropCard}>
                <Text style={styles.cropEmoji}>{c.emoji}</Text>
                <Text style={styles.cropLabel}>{c.label}</Text>
              </PressableScale>
            ))}
          </View>
        )

      case 'variety': {
        const crop = getCrop(answers.crop)
        if (crop?.varieties?.length) {
          return (
            <View style={styles.wrapChips}>
              {crop.varieties.map((v) => (
                <Chip key={v.key} label={v.label} onPress={() => advance(v.label, { variety: v.key, varietyLabel: v.label })} />
              ))}
              <Chip label="Je ne sais pas" onPress={() => advance('Je ne sais pas', { variety: null, varietyLabel: null })} />
            </View>
          )
        }
        return <TextSend draft={draft} setDraft={setDraft} placeholder="ex. Roma, ou « Je ne sais pas »" onSend={(v) => advance(v, { variety: v, varietyLabel: v })} />
      }

      case 'region':
        return (
          <View>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Chercher une région…"
                placeholderTextColor={colors.textFaint}
                value={regionQuery}
                onChangeText={setRegionQuery}
              />
            </View>
            <ScrollView style={styles.regionList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {REGIONS.filter((r) => {
                const q = regionQuery.trim().toLowerCase()
                return !q || r.name.toLowerCase().includes(q) || r.oldName.toLowerCase().includes(q) || r.chefLieu.toLowerCase().includes(q)
              }).map((r) => (
                <PressableScale key={r.key} onPress={() => advance(`${r.name} (ex-${r.oldName})`, { region: r.key, soil: r.soils[0] })} style={styles.regionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.regionName}>{r.name}</Text>
                    <Text style={styles.regionMeta}>ex-{r.oldName} · {r.chefLieu}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textFaint} />
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        )

      case 'soil': {
        const r = getRegion(answers.region)
        const options = showAllSoils ? Object.keys(SOILS) : r.soils
        return (
          <View style={styles.wrapChips}>
            {options.map((key) => (
              <Chip key={key} label={getSoil(key).label} active={answers.soil === key} onPress={() => advance(getSoil(key).label, { soil: key })} />
            ))}
            {!showAllSoils ? (
              <Chip label="Autre sol…" onPress={() => setShowAllSoils(true)} />
            ) : null}
          </View>
        )
      }

      case 'planting':
        return (
          <View style={styles.wrapChips}>
            {DATE_OPTIONS.map((o) => (
              <Chip key={o.label} label={o.label} onPress={() => advance(o.label, { planting_date: isoDaysAgo(o.days) })} />
            ))}
          </View>
        )

      case 'irrigation':
        return (
          <View style={styles.wrapChips}>
            {IRRIGATION_TYPES.map((i) => (
              <Chip key={i} label={i} onPress={() => advance(i, { irrigation: i })} />
            ))}
          </View>
        )

      case 'area':
        return (
          <TextSend
            draft={draft}
            setDraft={setDraft}
            placeholder="ex. 0,5 ha ou 200 plants"
            onSkip={() => advance('Je passe', { area: null })}
            onSend={(v) => advance(v, { area: v })}
          />
        )

      case 'sensor':
        return (
          <TextSend
            draft={draft}
            setDraft={setDraft}
            placeholder="ex. ESP32-01"
            onSkip={() => advance('Pas de capteur', { sensor: null })}
            onSend={(v) => advance(v, { sensor: v })}
          />
        )

      case 'summary':
        return <Button title="Créer ma parcelle" icon="check" loading={saving} onPress={submit} />

      default:
        return null
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={gradients.hero} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerIcon}>
          <Feather name="message-circle" size={18} color={colors.white} />
        </View>
        <View>
          <Text style={styles.headerEyebrow}>Configuration</Text>
          <Text style={styles.headerTitle}>Assistant AgriSmart</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.transcript} showsVerticalScrollIndicator={false}>
          {transcript.map((m, i) =>
            m.role === 'bot' ? <BotBubble key={i} text={m.text} /> : <UserBubble key={i} text={m.text} />
          )}
        </ScrollView>

        <Animated.View entering={FadeIn} style={[styles.inputZone, { paddingBottom: insets.bottom + 12 }]}>
          {renderInput()}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

// Text input + send (and optional skip)
function TextSend({ draft, setDraft, placeholder, onSend, onSkip }) {
  const canSend = draft.trim().length > 0
  return (
    <View>
      <View style={styles.textSendRow}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => canSend && onSend(draft.trim())}
          returnKeyType="send"
        />
        <PressableScale onPress={() => canSend && onSend(draft.trim())} style={[styles.sendBtn, !canSend && { opacity: 0.4 }]}>
          <Feather name="arrow-up" size={20} color={colors.white} />
        </PressableScale>
      </View>
      {onSkip ? (
        <PressableScale onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Passer</Text>
        </PressableScale>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { ...type.overline, color: 'rgba(255,255,255,0.7)' },
  headerTitle: { ...type.h1, color: colors.white },

  transcript: { padding: space.lg, paddingBottom: 20 },
  botRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12, maxWidth: '88%' },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  botBubble: { backgroundColor: colors.surface, borderRadius: 18, borderBottomLeftRadius: 4, padding: 13, borderWidth: 1, borderColor: colors.border, ...shadow.soft, flexShrink: 1 },
  botText: { ...type.body, color: colors.text },
  userRow: { alignSelf: 'flex-end', marginBottom: 12, maxWidth: '82%' },
  userBubble: { backgroundColor: colors.primary, borderRadius: 18, borderBottomRightRadius: 4, paddingVertical: 11, paddingHorizontal: 14 },
  userText: { ...type.bodyMed, color: colors.white },

  inputZone: { paddingHorizontal: space.lg, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },

  cropRow: { flexDirection: 'row', gap: 10 },
  cropCard: { flex: 1, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  cropEmoji: { fontSize: 26 },
  cropLabel: { ...type.caption, color: colors.text, marginTop: 6 },

  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.bg },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...type.caption, color: colors.text },
  chipTextActive: { color: colors.white },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, ...type.body, color: colors.text },
  regionList: { maxHeight: 230, marginTop: 8 },
  regionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  regionName: { ...type.title, color: colors.text },
  regionMeta: { ...type.caption, color: colors.textMuted, marginTop: 1 },

  textSendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textInput: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 48, ...type.body, color: colors.text },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  skip: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
  skipText: { ...type.bodyMed, color: colors.textMuted },
})
