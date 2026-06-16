import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeInLeft } from 'react-native-reanimated'
import { colors, radius, type, shadow } from '../theme'
import PressableScale from './ui/PressableScale'
import IconCircle from './ui/IconCircle'

export default function Recommendations({ tips, loading, error, onRefresh }) {
  return (
    <View style={[styles.box, shadow.card]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconCircle name="zap" color={colors.accent} bg={colors.accentLight} size={34} iconSize={16} />
          <Text style={styles.title}>Conseils IA</Text>
        </View>
        <PressableScale onPress={onRefresh} disabled={loading} style={styles.refresh} hitSlop={8}>
          <Feather name="refresh-cw" size={15} color={colors.primary} />
        </PressableScale>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 14 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : tips.length === 0 ? (
        <Text style={styles.empty}>
          Appuie sur l'icône pour générer des conseils adaptés aux conditions du champ.
        </Text>
      ) : (
        tips.map((tip, i) => (
          <Animated.View key={i} entering={FadeInLeft.duration(320).delay(i * 90)} style={styles.tipRow}>
            <View style={styles.bullet} />
            <Text style={styles.tip}>{tip}</Text>
          </Animated.View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, margin: 6, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { ...type.h2, color: colors.text },
  refresh: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 10 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7 },
  tip: { ...type.body, color: colors.text, flex: 1 },
  empty: { ...type.body, color: colors.textMuted, marginTop: 10 },
  error: { ...type.bodyMed, color: colors.danger, marginTop: 10 },
})
