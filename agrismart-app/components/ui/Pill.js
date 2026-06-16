import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius, type } from '../../theme'

// tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'
const TONES = {
  success: { fg: colors.success, bg: colors.successBg },
  warning: { fg: colors.warning, bg: colors.warningBg },
  danger: { fg: colors.danger, bg: colors.dangerBg },
  accent: { fg: colors.accent, bg: colors.accentLight },
  neutral: { fg: colors.textMuted, bg: colors.surfaceAlt },
}

export default function Pill({ label, tone = 'neutral', icon }) {
  const t = TONES[tone] || TONES.neutral
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon ? <Feather name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  text: { ...type.caption },
})
