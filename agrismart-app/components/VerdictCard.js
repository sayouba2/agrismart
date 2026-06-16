import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, radius, type, shadow } from '../theme'
import Pill from './ui/Pill'

const HEALTH = {
  bonne: { tone: 'success', label: 'Bonne santé' },
  moyenne: { tone: 'warning', label: 'Santé moyenne' },
  mauvaise: { tone: 'danger', label: 'Mauvaise santé' },
}

export default function VerdictCard({ verdict }) {
  if (!verdict) return null
  const health = HEALTH[(verdict.sante || '').toLowerCase()] || { tone: 'neutral', label: verdict.sante || '—' }
  const hasAnomaly = verdict.anomalie?.presente
  const ready = verdict.pret_a_avancer

  return (
    <Animated.View entering={FadeInDown.duration(420)} style={[styles.card, shadow.card]}>
      <View style={styles.head}>
        <View>
          <Text style={styles.overline}>Stade détecté</Text>
          <Text style={styles.stage}>{verdict.stade_detecte || '—'}</Text>
        </View>
        <Pill label={health.label} tone={health.tone} icon="activity" />
      </View>

      <View style={[styles.statusBox, { backgroundColor: hasAnomaly ? colors.dangerBg : colors.successBg }]}>
        <Feather name={hasAnomaly ? 'alert-triangle' : 'check-circle'} size={18} color={hasAnomaly ? colors.danger : colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusText, { color: hasAnomaly ? colors.danger : colors.success }]}>
            {hasAnomaly ? `${verdict.anomalie.type} · ${verdict.anomalie.gravite}` : 'Aucune anomalie détectée'}
          </Text>
          {hasAnomaly && verdict.anomalie.description ? (
            <Text style={styles.anomalyDesc}>{verdict.anomalie.description}</Text>
          ) : null}
        </View>
      </View>

      {verdict.recommandations?.length ? (
        <View style={styles.recoBlock}>
          <Text style={styles.recoTitle}>Recommandations</Text>
          {verdict.recommandations.map((r, i) => (
            <View key={i} style={styles.recoRow}>
              <View style={styles.bullet} />
              <Text style={styles.reco}>{r}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.ready, { backgroundColor: ready ? colors.successBg : colors.warningBg }]}>
        <Feather name={ready ? 'unlock' : 'clock'} size={16} color={ready ? colors.success : colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.readyText, { color: ready ? colors.success : colors.warning }]}>
            {ready ? 'Prêt à passer au stade suivant' : 'Stade pas encore terminé'}
          </Text>
          {verdict.raison_blocage ? <Text style={styles.readyReason}>{verdict.raison_blocage}</Text> : null}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { ...type.overline, color: colors.textFaint },
  stage: { ...type.h2, color: colors.text, marginTop: 2 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: radius.md, padding: 13, marginTop: 14 },
  statusText: { ...type.bodyMed },
  anomalyDesc: { ...type.caption, color: colors.text, marginTop: 4, lineHeight: 17 },
  recoBlock: { marginTop: 16 },
  recoTitle: { ...type.label, color: colors.textMuted, marginBottom: 6 },
  recoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7 },
  reco: { ...type.body, color: colors.text, flex: 1 },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, padding: 13, marginTop: 16 },
  readyText: { ...type.title },
  readyReason: { ...type.caption, color: colors.textMuted, marginTop: 2 },
})
