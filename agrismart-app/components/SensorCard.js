import { View, Text, StyleSheet } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { statusOf } from '../logic/alerts'
import { colors, radius, type, shadow, font } from '../theme'
import IconCircle from './ui/IconCircle'

const STATE = {
  ok: { fg: colors.success, bg: colors.successBg, label: 'Normal' },
  danger: { fg: colors.danger, bg: colors.dangerBg, label: 'Hors plage' },
  unknown: { fg: colors.textMuted, bg: colors.surfaceAlt, label: '—' },
}

export default function SensorCard({ label, value, unit, range, icon, index = 0 }) {
  const status = statusOf(value, range)
  const s = STATE[status]

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(index * 90)} style={styles.card}>
      <View style={styles.top}>
        <IconCircle name={icon} color={s.fg} bg={s.bg} size={36} iconSize={17} />
        <View style={[styles.dot, { backgroundColor: s.fg }]} />
      </View>

      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value == null ? '--' : value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      <Text style={[styles.status, { color: s.fg }]}>{s.label}</Text>
      {range ? (
        <Text style={styles.range}>
          idéal {range.min}–{range.max}{unit}
        </Text>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...type.label, color: colors.textMuted, marginTop: 12 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  value: { fontFamily: font.extrabold, fontSize: 34, color: colors.text, letterSpacing: -1 },
  unit: { fontFamily: font.bold, fontSize: 16, color: colors.textMuted, marginBottom: 5, marginLeft: 3 },
  status: { ...type.caption, marginTop: 2 },
  range: { ...type.caption, color: colors.textFaint, marginTop: 4 },
})
