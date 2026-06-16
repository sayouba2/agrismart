import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { useFocusReplay } from '../hooks/useFocusReplay'
import { getCrop } from '../data/crops'
import { getRegion, getZone } from '../data/regions'
import { getSoil } from '../data/soils'
import { colors, type, radius, space } from '../theme'
import Hero from '../components/ui/Hero'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PressableScale from '../components/ui/PressableScale'

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={15} color={colors.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  )
}

// One culture in the "Mes cultures" list
function CultureRow({ item, active, onPress }) {
  const crop = getCrop(item.crop_type)
  const region = getRegion(item.region)
  return (
    <PressableScale onPress={onPress} style={[styles.cultureRow, active && styles.cultureRowActive]}>
      <View style={styles.cultureEmoji}>
        <Text style={{ fontSize: 20 }}>{crop?.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cultureLabel}>{crop?.label}{item.variety ? ` · ${item.variety}` : ''}</Text>
        <Text style={styles.cultureMeta}>{region ? region.name : 'Région ?'}</Text>
      </View>
      {active ? (
        <View style={styles.activeBadge}>
          <Feather name="check" size={13} color={colors.white} />
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={18} color={colors.textFaint} />
      )}
    </PressableScale>
  )
}

export default function ProfileScreen({ navigation }) {
  const { profile, profiles, switchProfile, removeProfile } = useApp()
  const replayKey = useFocusReplay()
  const crop = profile ? getCrop(profile.crop_type) : null
  const region = profile ? getRegion(profile.region) : null
  const zone = region ? getZone(region.zone) : null
  const soil = profile ? getSoil(profile.soil_type) : null

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer cette culture',
      `Supprimer « ${crop?.label} » et tout son historique ? Action irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeProfile(profile.id) },
      ]
    )
  }

  return (
    <View style={styles.screen} key={replayKey}>
      <Hero
        eyebrow="Profil"
        title={crop?.label ?? 'Ma culture'}
        right={<View style={styles.cropBadge}><Text style={styles.cropEmoji}>{crop?.emoji}</Text></View>}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Multi-culture management */}
        <Card>
          <Text style={styles.cardTitle}>Mes cultures</Text>
          {profiles.map((p) => (
            <CultureRow
              key={p.id}
              item={p}
              active={p.id === profile?.id}
              onPress={() => p.id !== profile?.id && switchProfile(p.id)}
            />
          ))}
          <Button
            title="Ajouter une culture"
            icon="plus"
            variant="secondary"
            onPress={() => navigation.navigate('AjouterCulture')}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Active culture details */}
        <Card style={{ marginTop: 12 }} index={1}>
          <Text style={styles.cardTitle}>Détails de la culture</Text>
          <Row icon="tag" label="Variété" value={profile?.variety} />
          <Row icon="calendar" label="Date de semis" value={profile?.planting_date} />
          <Row icon="map-pin" label="Région" value={region ? `${region.name} (ex-${region.oldName})` : null} />
          <Row icon="home" label="Chef-lieu" value={region?.chefLieu} />
          <Row icon="sun" label="Zone climatique" value={zone?.label} />
          <Row icon="layers" label="Type de sol" value={soil?.label} />
          <Row icon="droplet" label="Irrigation" value={profile?.irrigation} />
          <Row icon="maximize" label="Surface / plants" value={profile?.area} />
          <Row icon="cpu" label="Capteur" value={profile?.sensor_id} />
        </Card>

        {/* Settings */}
        <Card style={{ marginTop: 12 }} index={2}>
          <Text style={styles.cardTitle}>Réglages</Text>
          <PressableScale onPress={() => navigation.navigate('AlertesSMS')} style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Feather name="message-square" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Alertes SMS</Text>
              <Text style={styles.settingSub}>Recevoir les alertes capteurs par SMS</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textFaint} />
          </PressableScale>
        </Card>

        <Button title="Supprimer cette culture" icon="trash-2" variant="danger" onPress={confirmDelete} style={{ marginTop: 16 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 110 },
  cropBadge: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  cropEmoji: { fontSize: 24 },
  cardTitle: { ...type.h2, color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowLabel: { ...type.bodyMed, color: colors.textMuted },
  rowValue: { ...type.bodyMed, color: colors.text, maxWidth: '55%', textAlign: 'right' },

  cultureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  cultureRowActive: {},
  cultureEmoji: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cultureLabel: { ...type.title, color: colors.text },
  cultureMeta: { ...type.caption, color: colors.textMuted, marginTop: 1 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  activeBadgeText: { ...type.caption, color: colors.white },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  settingIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { ...type.title, color: colors.text },
  settingSub: { ...type.caption, color: colors.textMuted, marginTop: 1 },
})

