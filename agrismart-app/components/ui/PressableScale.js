import { Pressable } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// A pressable that springs down slightly when touched — adds tactile life.
export default function PressableScale({ children, style, onPress, disabled, hitSlop, to = 0.96 }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => (scale.value = withSpring(to, { damping: 15, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  )
}
