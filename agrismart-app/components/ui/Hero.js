import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, gradients, type, radius } from '../../theme'
import PressableScale from './PressableScale'

// Gradient header used at the top of screens. Supports a back button, an
// eyebrow line, a title, a subtitle and an optional right-side slot.
export default function Hero({ eyebrow, title, subtitle, onBack, right, children, rounded = true }) {
  const insets = useSafeAreaInsets()
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, rounded && styles.rounded, { paddingTop: insets.top + 14 }]}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.topRow}>
          <View style={styles.left}>
            {onBack ? (
              <PressableScale onPress={onBack} style={styles.back} hitSlop={10}>
                <Feather name="chevron-left" size={22} color={colors.white} />
              </PressableScale>
            ) : null}
            <View style={{ flex: 1 }}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
          {right ?? null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingBottom: 22 },
  rounded: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  back: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.overline, color: 'rgba(255,255,255,0.72)' },
  title: { ...type.h1, color: colors.white, marginTop: 2 },
  subtitle: { ...type.bodyMed, color: 'rgba(255,255,255,0.82)', marginTop: 8 },
})
