import { View, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius } from '../../theme'

// A rounded-square icon chip — replaces emoji "stickers" with clean iconography.
export default function IconCircle({ name, color = colors.primary, bg = colors.primaryLight, size = 40, iconSize = 19 }) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: radius.md, backgroundColor: bg }]}>
      <Feather name={name} size={iconSize} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
})
