import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, radius, type, shadow } from '../theme'
import Pill from './ui/Pill'
import Button from './ui/Button'
import PressableScale from './ui/PressableScale'

const STATUS = {
  open: { tone: 'danger', label: 'Ouverte' },
  monitoring: { tone: 'warning', label: 'En suivi' },
  resolved: { tone: 'success', label: 'Résolue' },
}

export default function AnomalyCard({ anomaly, onResolve, onPress, index = 0 }) {
  const s = STATUS[anomaly.status] || STATUS.open
  const resolved = anomaly.status === 'resolved'

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(index * 80)}
      style={[styles.card, shadow.soft, { borderLeftColor: STATUS[anomaly.status]?.tone === 'success' ? colors.success : anomaly.status === 'monitoring' ? colors.warning : colors.danger }]}
    >
      <PressableScale onPress={() => onPress?.(anomaly)}>
        <View style={styles.header}>
          <Text style={styles.type}>{anomaly.type}</Text>
          <Pill label={s.label} tone={s.tone} />
        </View>
        {anomaly.severity ? <Text style={styles.meta}>Gravité : {anomaly.severity}</Text> : null}

        {anomaly.treatment ? (
          <View style={styles.treatBox}>
            <Feather name="info" size={15} color={colors.primary} />
            <Text style={styles.treatment}>{anomaly.treatment}</Text>
          </View>
        ) : null}

        <View style={styles.detailsHint}>
          <Feather name="book-open" size={13} color={colors.primary} />
          <Text style={styles.detailsHintText}>Voir l'explication détaillée</Text>
          <Feather name="chevron-right" size={15} color={colors.primary} />
        </View>
      </PressableScale>

      {!resolved ? (
        <Button title="Confirmer la résolution" icon="camera" variant="secondary" onPress={() => onResolve?.(anomaly)} style={{ marginTop: 14 }} />
      ) : (
        <View style={styles.resolvedRow}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={styles.resolvedAt}>Résolue le {formatDate(anomaly.resolved_at)}</Text>
        </View>
      )}
    </Animated.View>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR')
  } catch {
    return iso
  }
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  type: { ...type.title, color: colors.text, flex: 1 },
  meta: { ...type.caption, color: colors.textMuted, marginTop: 8 },
  treatBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 12, marginTop: 12, alignItems: 'flex-start' },
  treatment: { ...type.bodyMed, color: colors.primaryDark, flex: 1 },
  resolvedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  resolvedAt: { ...type.caption, color: colors.success },
  detailsHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  detailsHintText: { ...type.caption, color: colors.primary, flex: 1 },
})
