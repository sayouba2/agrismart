import { StyleSheet } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, radius, shadow } from '../../theme'

// A surface that fades + lifts into place. Stagger lists with the `index` prop.
export default function Card({ children, style, index = 0, delay }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay ?? index * 80)}
      style={[styles.card, style]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
})
