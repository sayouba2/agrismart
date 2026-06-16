import { View, Text, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeInLeft } from 'react-native-reanimated'
import { colors, radius, type } from '../theme'
import PressableScale from './ui/PressableScale'

const DOT = {
  done: { bg: colors.primary, icon: 'check', ring: colors.primaryLight },
  active: { bg: colors.accent, icon: 'navigation', ring: colors.accentLight },
  locked: { bg: colors.surfaceAlt, icon: 'lock', ring: 'transparent' },
}

export default function StageStepper({ stages, onPressStage }) {
  return (
    <View>
      {stages.map((stage, i) => {
        const cfg = DOT[stage.status] || DOT.locked
        const isLast = i === stages.length - 1
        const tappable = stage.status === 'active'
        const iconColor = stage.status === 'locked' ? colors.textFaint : colors.white

        return (
          <Animated.View key={stage.id} entering={FadeInLeft.duration(360).delay(i * 70)}>
            <PressableScale
              disabled={!tappable}
              onPress={() => tappable && onPressStage?.(stage)}
              style={styles.item}
            >
              <View style={styles.rail}>
                <View style={[styles.ring, { backgroundColor: cfg.ring }]}>
                  <View style={[styles.dot, { backgroundColor: cfg.bg }]}>
                    <Feather name={cfg.icon} size={15} color={iconColor} />
                  </View>
                </View>
                {!isLast ? <View style={[styles.line, stage.status === 'done' && { backgroundColor: colors.primary }]} /> : null}
              </View>

              <View style={[styles.body, tappable && styles.bodyActive]}>
                <Text style={[styles.label, stage.status === 'locked' && styles.lockedLabel]}>{stage.label}</Text>
                <Text style={[styles.status, tappable && { color: colors.accent }]}>
                  {stage.status === 'done' && 'Terminé'}
                  {stage.status === 'active' && 'En cours · appuie pour inspecter'}
                  {stage.status === 'locked' && 'Verrouillé'}
                </Text>
              </View>

              {tappable ? <Feather name="chevron-right" size={20} color={colors.accent} /> : null}
            </PressableScale>
          </Animated.View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center' },
  rail: { width: 48, alignItems: 'center', alignSelf: 'stretch' },
  ring: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2.5, flex: 1, backgroundColor: colors.border, marginVertical: 2, minHeight: 14 },
  body: { flex: 1, paddingVertical: 14, paddingLeft: 10 },
  bodyActive: { },
  label: { ...type.title, color: colors.text },
  lockedLabel: { color: colors.textFaint },
  status: { ...type.caption, color: colors.textMuted, marginTop: 3 },
})
