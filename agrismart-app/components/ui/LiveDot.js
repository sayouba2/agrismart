import { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { colors } from '../../theme'

// A small dot with a pulsing halo — green when live, grey when offline.
export default function LiveDot({ active = true, size = 9 }) {
  const color = active ? colors.success : colors.textFaint
  const pulse = useSharedValue(0)

  useEffect(() => {
    if (active) {
      pulse.value = 0
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false)
    } else {
      pulse.value = 0
    }
  }, [active])

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.8 }],
  }))

  return (
    <View style={styles.wrap}>
      {active ? (
        <Animated.View style={[styles.halo, haloStyle, { width: size, height: size, borderRadius: size, backgroundColor: color }]} />
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: 12, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
})
