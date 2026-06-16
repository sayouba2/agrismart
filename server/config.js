import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Load .env from the server/ folder
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: __dirname + '/.env' })

const config = {
  ESP32_IP: process.env.ESP32_IP,
  ESP32_URL: `http://${process.env.ESP32_IP}/status`,
  SERVER_PORT: process.env.SERVER_PORT || 3000,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // ElevenLabs (voix réaliste). Si la clé est vide, l'app utilise le TTS du téléphone.
  // Laisser ELEVENLABS_VOICE_ID vide => le serveur choisit automatiquement une voix
  // disponible sur le compte (les voix de bibliothèque sont bloquées en plan gratuit).
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || null,

  // Twilio (SMS).
  // Auth simple : ACCOUNT_SID (AC...) + AUTH_TOKEN.
  // Auth par clé API : ACCOUNT_SID (AC...) + API_KEY_SID (SK...) + API_KEY_SECRET.
  // Dans les deux cas l'ACCOUNT_SID (AC...) est OBLIGATOIRE (il est dans l'URL).
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID, // AC...
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY_SID: process.env.TWILIO_API_KEY_SID, // optionnel, SK...
  TWILIO_API_KEY_SECRET: process.env.TWILIO_API_KEY_SECRET, // optionnel
  // Expéditeur : SOIT un numéro From, SOIT une Messaging Service (MG...). La MG est prioritaire.
  TWILIO_FROM: process.env.TWILIO_FROM, // ex. +1XXXXXXXXXX
  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID, // MG...

  // When true, the server invents realistic sensor data instead of polling the
  // ESP32 — lets you develop the whole app before the hardware is wired up.
  SIMULATE: process.env.SIMULATE === 'true',

  thresholds: {
    temperature: { min: Number(process.env.TEMP_MIN), max: Number(process.env.TEMP_MAX) },
    humidity:    { min: Number(process.env.HUM_MIN),  max: Number(process.env.HUM_MAX)  },
  },
}

export default config
