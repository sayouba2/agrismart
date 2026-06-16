import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fetchHistory } from '../api/sensors'
import { colors, type, radius, shadow } from '../theme'
import PressableScale from './ui/PressableScale'
import LineChart from './ui/LineChart'

// Tiny module-level cache so switching tabs doesn't re-fetch / flicker
const cache = {}

const RANGES = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7 jours' },
]

export default function HistoryCard() {
  const [range, setRange] = useState('24h')
  const [points, setPoints] = useState(cache['24h']?.points ?? [])
  const [loading, setLoading] = useState(!cache['24h'])

  const load = useCallback(async (r) => {
    if (cache[r]) setPoints(cache[r].points)
    setLoading(!cache[r])
    try {
      const data = await fetchHistory(r)
      cache[r] = { points: data.points }
      setPoints(data.points)
    } catch {
      // keep whatever we had
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(range)
  }, [range, load])

  const temps = points.map((p) => p.temperature)
  const hums = points.map((p) => p.humidity)

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="bar-chart-2" size={18} color={colors.primary} />
          <Text style={styles.title}>Historique</Text>
        </View>
        <View style={styles.toggle}>
          {RANGES.map((r) => (
            <PressableScale key={r.key} onPress={() => setRange(r.key)} style={[styles.seg, range === r.key && styles.segActive]}>
              <Text style={[styles.segText, range === r.key && styles.segTextActive]}>{r.label}</Text>
            </PressableScale>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
      ) : (
        <>
          <View style={styles.chartBlock}>
            <Text style={[styles.chartLabel, { color: colors.danger }]}>🌡️ Température (°C)</Text>
            <LineChart values={temps} color={colors.danger} unit="°" />
          </View>
          <View style={styles.chartBlock}>
            <Text style={[styles.chartLabel, { color: colors.primary }]}>💧 Humidité (%)</Text>
            <LineChart values={hums} color="#1f7ae0" unit="%" />
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, margin: 6, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { ...type.h2, color: colors.text },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 3 },
  seg: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  segActive: { backgroundColor: colors.primary },
  segText: { ...type.caption, color: colors.textMuted },
  segTextActive: { color: colors.white },
  chartBlock: { marginTop: 14 },
  chartLabel: { ...type.label, marginBottom: 8 },
})
