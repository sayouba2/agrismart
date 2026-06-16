import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

// Compress enough to keep the base64 payload small for the API call.
const OPTIONS = { base64: true, quality: 0.4, allowsEditing: true, aspect: [4, 3] }

async function fromCamera() {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) {
    Alert.alert('Permission requise', 'Autorise l\'accès à la caméra pour prendre une photo.')
    return null
  }
  const res = await ImagePicker.launchCameraAsync(OPTIONS)
  return res.canceled ? null : res.assets[0]
}

async function fromLibrary() {
  const res = await ImagePicker.launchImageLibraryAsync(OPTIONS)
  return res.canceled ? null : res.assets[0]
}

// Ask the user: camera or gallery, then return { uri, base64 } or null.
export function pickPlantImage() {
  return new Promise((resolve) => {
    Alert.alert('Photo du plant', 'Comment veux-tu ajouter la photo ?', [
      { text: 'Caméra', onPress: async () => resolve(await fromCamera()) },
      { text: 'Galerie', onPress: async () => resolve(await fromLibrary()) },
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
    ])
  })
}
