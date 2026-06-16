import { View, Text, StyleSheet } from 'react-native'
import { colors, type } from '../../theme'

export default function SectionHeader({ title, action }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ?? null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  title: { ...type.h2, color: colors.text },
})
