import { useState, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { colors, type } from '../../theme'

let uid = 0

// Lightweight line chart with an area gradient. `values` is an array of numbers.
export default function LineChart({ values = [], color = colors.primary, height = 110, unit = '' }) {
  const [w, setW] = useState(0)
  const idRef = useRef(`grad${uid++}`)

  if (!values || values.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Pas encore assez de données</Text>
      </View>
    )
  }

  const pad = 8
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerH = height - pad * 2
  const stepX = w > 0 ? w / (values.length - 1) : 0
  const x = (i) => i * stepX
  const y = (v) => pad + innerH - ((v - min) / span) * innerH

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(values.length - 1).toFixed(1)} ${height} L 0 ${height} Z`

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      <View style={styles.minmax}>
        <Text style={styles.axis}>{max}{unit}</Text>
        <Text style={styles.axis}>{min}{unit}</Text>
      </View>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id={idRef.current} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.28" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${idRef.current})`} />
          <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...type.caption, color: colors.textFaint },
  minmax: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingVertical: 2 },
  axis: { ...type.caption, color: colors.textFaint, fontSize: 10 },
})
