import { SERVER_URL } from '../config'

// Fetch the latest sensor reading + alert thresholds from the server.
export async function fetchSensors() {
  const res = await fetch(`${SERVER_URL}/api/sensors`)
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.json()
}

// Ask the server (which calls OpenAI) for farming advice based on current data
// plus the agronomic context (crop, region, climate zone, soil).
export async function fetchRecommendations(payload) {
  const res = await fetch(`${SERVER_URL}/api/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.json()
}

// Sensor history series for charts. range: '24h' | '7d'
export async function fetchHistory(range = '24h') {
  const res = await fetch(`${SERVER_URL}/api/history?range=${range}`)
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.json()
}

// --- SMS alerts settings ---
export async function getSmsConfig() {
  const res = await fetch(`${SERVER_URL}/api/sms/config`)
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.json()
}

export async function updateSmsConfig({ enabled, phone }) {
  const res = await fetch(`${SERVER_URL}/api/sms/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled, phone }),
  })
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.json()
}

export async function sendTestSms(phone) {
  const res = await fetch(`${SERVER_URL}/api/sms/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Server responded ${res.status}`)
  return json
}

// Get a realistic French voice-over (ElevenLabs) for the given text, as base64 mp3.
// Throws on 503 (no key) or error — the caller then falls back to device TTS.
export async function fetchTts(text) {
  const res = await fetch(`${SERVER_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`TTS ${res.status}`)
  const json = await res.json()
  return json.audioBase64
}

// Ask the server for a detailed, context-locked explanation of a diagnosed anomaly.
export async function fetchAnomalyDetails(payload) {
  const res = await fetch(`${SERVER_URL}/api/anomaly-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.json()
}

// Send a plant photo (base64) + context to the server, which calls GPT-4o vision.
// mode 'inspection' → stage/anomaly/ready verdict.
// mode 'resolution' → checks whether a treated anomaly is now resolved.
export async function analyzeInspection(payload) {
  const res = await fetch(`${SERVER_URL}/api/inspection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Server responded ${res.status} ${detail}`)
  }
  return res.json()
}
