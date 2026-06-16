import { useEffect, useState } from 'react'
import { ScrollView, View, Text, TextInput, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { getSmsConfig, updateSmsConfig, sendTestSms } from '../api/sensors'
import { colors, type, radius, space, shadow } from '../theme'
import Hero from '../components/ui/Hero'
import Button from '../components/ui/Button'

export default function SmsSettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const c = await getSmsConfig()
        setConfigured(c.configured)
        setEnabled(c.enabled)
        setPhone(c.phone || '')
      } catch {
        Alert.alert('Erreur', 'Serveur injoignable.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await updateSmsConfig({ enabled, phone: phone.trim() })
      Alert.alert('Enregistré', 'Tes préférences d\'alertes SMS ont été sauvegardées.')
    } catch (e) {
      Alert.alert('Erreur', String(e?.message ?? e))
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    if (!phone.trim()) return Alert.alert('Numéro requis', 'Saisis un numéro (format international, ex. +226...).')
    setTesting(true)
    try {
      await sendTestSms(phone.trim())
      Alert.alert('SMS envoyé', 'Un SMS de test a été envoyé. Vérifie ton téléphone.')
    } catch (e) {
      Alert.alert('Échec', String(e?.message ?? e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <Hero eyebrow="Inclusivité" title="Alertes SMS" subtitle="Reçois les alertes capteurs par SMS, même sans connexion data." onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <>
            {!configured ? (
              <View style={styles.warn}>
                <Feather name="alert-triangle" size={16} color={colors.warning} />
                <Text style={styles.warnText}>
                  Le service SMS n'est pas encore configuré sur le serveur (identifiants Twilio manquants). Tu peux quand même enregistrer ton numéro.
                </Text>
              </View>
            ) : null}

            <View style={[styles.card, shadow.card]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Activer les alertes SMS</Text>
                  <Text style={styles.rowSub}>Envoie un SMS quand la température ou l'humidité sort des seuils.</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={setEnabled}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.white}
                />
              </View>

              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+212 6 00 00 00 00"
                placeholderTextColor={colors.textFaint}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}>Format international obligatoire (ex. +212 pour le Maroc, +226 pour le Burkina).</Text>
            </View>

            <Button title="Enregistrer" icon="check" loading={saving} onPress={save} style={{ marginTop: 16 }} />
            <Button title="Envoyer un SMS de test" icon="send" variant="secondary" loading={testing} onPress={test} style={{ marginTop: 10 }} />

            <View style={styles.note}>
              <Feather name="info" size={14} color={colors.textMuted} />
              <Text style={styles.noteText}>Les alertes sont limitées à une toutes les 30 minutes pour éviter le spam.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: 140 },
  warn: { flexDirection: 'row', gap: 9, backgroundColor: colors.warningBg, borderRadius: radius.md, padding: 13, marginBottom: 14 },
  warnText: { ...type.caption, color: colors.warning, flex: 1, lineHeight: 17 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { ...type.title, color: colors.text },
  rowSub: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  label: { ...type.label, color: colors.text, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 48, ...type.body, color: colors.text },
  hint: { ...type.caption, color: colors.textFaint, marginTop: 8 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 18 },
  noteText: { ...type.caption, color: colors.textMuted, flex: 1 },
})
