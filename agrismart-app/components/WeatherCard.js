import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { fetchWeather, weatherInfo, weatherAdvice } from '../logic/weather'
import { colors, type, radius, shadow } from '../theme'

const cache = {} // region key -> { data, ts }
const TTL = 10 * 60 * 1000

function dayLabel(dateStr, index) {
  if (index === 0) return "Auj."
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
  } catch {
    return ''
  }
}

export default function WeatherCard({ region }) {
  const [data, setData] = useState(region ? cache[region.key]?.data : null)
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!region?.lat) return
    const cached = cache[region.key]
    if (cached) {
      setData(cached.data)
      setLoading(false)
      if (Date.now() - cached.ts < TTL) return // still fresh
    }
    ;(async () => {
      try {
        const w = await fetchWeather(region.lat, region.lon)
        cache[region.key] = { data: w, ts: Date.now() }
        setData(w)
        setError(false)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [region?.key])

  if (!region?.lat) return null

  const info = data ? weatherInfo(data.current.code) : null
  const advice = data ? weatherAdvice(data.daily) : null

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="cloud" size={18} color={colors.primary} />
          <Text style={styles.title}>Météo · {region.chefLieu}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : error || !data ? (
        <Text style={styles.error}>Météo indisponible (vérifie la connexion internet).</Text>
      ) : (
        <>
          <View style={styles.current}>
            <Feather name={info.icon} size={42} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.temp}>{data.current.temp}°C</Text>
              <Text style={styles.label}>{info.label}</Text>
            </View>
            <View style={styles.chips}>
              <View style={styles.chip}>
                <Feather name="droplet" size={12} color={colors.textMuted} />
                <Text style={styles.chipText}>{data.current.humidity}%</Text>
              </View>
              <View style={styles.chip}>
                <Feather name="umbrella" size={12} color={colors.textMuted} />
                <Text style={styles.chipText}>{data.current.precip} mm</Text>
              </View>
            </View>
          </View>

          <View style={styles.forecast}>
            {data.daily.map((d, i) => {
              const di = weatherInfo(d.code)
              return (
                <View key={d.date} style={styles.day}>
                  <Text style={styles.dayLabel}>{dayLabel(d.date, i)}</Text>
                  <Feather name={di.icon} size={18} color={colors.textMuted} />
                  <Text style={styles.dayMax}>{d.tmax}°</Text>
                  <Text style={styles.dayMin}>{d.tmin}°</Text>
                  {d.precip > 0 ? <Text style={styles.rain}>{d.precip}mm</Text> : <Text style={styles.rainEmpty}>—</Text>}
                </View>
              )
            })}
          </View>

          {advice ? (
            <View style={styles.advice}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={styles.adviceText}>{advice}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, margin: 6, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { ...type.h2, color: colors.text },
  error: { ...type.bodyMed, color: colors.textMuted, marginTop: 10 },
  current: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  temp: { fontFamily: type.display.fontFamily, fontSize: 30, color: colors.text },
  label: { ...type.bodyMed, color: colors.textMuted },
  chips: { gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { ...type.caption, color: colors.textMuted },
  forecast: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  day: { alignItems: 'center', gap: 4, flex: 1 },
  dayLabel: { ...type.caption, color: colors.textMuted, textTransform: 'capitalize' },
  dayMax: { ...type.label, color: colors.text },
  dayMin: { ...type.caption, color: colors.textFaint },
  rain: { ...type.caption, color: '#1f7ae0', fontSize: 10 },
  rainEmpty: { ...type.caption, color: colors.textFaint, fontSize: 10 },
  advice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 11, marginTop: 14 },
  adviceText: { ...type.caption, color: colors.primaryDark, flex: 1 },
})
