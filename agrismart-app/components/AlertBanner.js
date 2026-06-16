import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeIn } from 'react-native-reanimated'
import { colors, radius, type, shadow } from '../theme'

// Green when everything is fine, amber/red when there are active alerts.
export default function AlertBanner({ alerts }) {
  const dangers = alerts.filter((a) => a.level === 'danger')
  const ok = dangers.length === 0

  return (
    <Animated.View
      key={ok ? 'ok' : 'alert'}
      entering={FadeIn.duration(360)}
      style={[styles.banner, { backgroundColor: ok ? colors.successBg : colors.dangerBg }, shadow.soft]}
    >
      <View style={styles.header}>
        <Feather
          name={ok ? 'check-circle' : 'alert-triangle'}
          size={18}
          color={ok ? colors.success : colors.danger}
        />
        <Text style={[styles.title, { color: ok ? colors.success : colors.danger }]}>
          {ok ? 'Conditions optimales' : `${dangers.length} alerte${dangers.length > 1 ? 's' : ''} active${dangers.length > 1 ? 's' : ''}`}
        </Text>
      </View>
      {!ok &&
        dangers.map((a, i) => (
          <Text key={i} style={styles.line}>
            {a.message}
          </Text>
        ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.lg, padding: 16, marginHorizontal: 6, marginTop: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...type.title },
  line: { ...type.bodyMed, color: colors.danger, marginTop: 6, marginLeft: 26 },
})
