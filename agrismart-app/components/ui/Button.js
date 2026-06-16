import { Text, StyleSheet, View, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import PressableScale from './PressableScale'
import { colors, radius, type, gradients, shadow } from '../../theme'

// variant: 'primary' | 'secondary' | 'ghost' | 'danger'
export default function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
  full = true,
}) {
  const isPrimary = variant === 'primary'
  const tint = {
    secondary: colors.primary,
    ghost: colors.primary,
    danger: colors.danger,
  }[variant] || colors.white

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : tint} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={18} color={isPrimary ? colors.white : tint} /> : null}
          <Text style={[styles.label, { color: isPrimary ? colors.white : tint }]}>{title}</Text>
        </>
      )}
    </View>
  )

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[full && { alignSelf: 'stretch' }, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      {isPrimary ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.base, shadow.soft]}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.base,
            variant === 'secondary' && styles.secondary,
            variant === 'ghost' && styles.ghost,
            variant === 'danger' && styles.dangerBox,
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...type.title },
  secondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: colors.primaryLight },
  dangerBox: { backgroundColor: colors.dangerBg },
})
