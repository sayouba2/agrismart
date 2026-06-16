import express from 'express'
import fetch from 'node-fetch'
import OpenAI from 'openai'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import config from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
// Larger limit: inspection photos are sent as base64
app.use(express.json({ limit: '12mb' }))

// OpenAI client — key stays on the server, never shipped to the mobile app
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY })

// Allow the mobile app (Expo) and any LAN client to call this server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Latest sensor data stored in memory
let latestData = {
  temperature: null,
  humidity: null,
  connected: false,
  lastUpdate: null,
}

// --- Rolling history ---------------------------------------------------------
// We poll every 2s for the live display, but only keep one sample per minute.
// History is kept 7 days (for charts) and persisted to disk so it survives a
// restart. The 24h average feeds the image analysis so a single noisy reading
// can never block a stage transition.
const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // store 7 days
const AVG_WINDOW_MS = 24 * 60 * 60 * 1000 // average over 24h
const HISTORY_SAMPLE_MS = 60 * 1000
const HISTORY_FILE = join(__dirname, 'history.json')
let history = []
let lastHistoryPush = 0
let saveTimer = null

function loadHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8')
    const cutoff = Date.now() - HISTORY_WINDOW_MS
    history = JSON.parse(raw).filter((h) => h.t >= cutoff)
    console.log(`Historique chargé : ${history.length} échantillons`)
  } catch {
    history = []
  }
}

function saveHistory() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    fs.writeFile(HISTORY_FILE, JSON.stringify(history), () => {})
  }, 2000)
}

function recordHistory() {
  if (!latestData.connected || latestData.temperature == null) return
  const now = Date.now()
  if (now - lastHistoryPush < HISTORY_SAMPLE_MS) return
  lastHistoryPush = now
  history.push({ t: now, temperature: latestData.temperature, humidity: latestData.humidity })
  const cutoff = now - HISTORY_WINDOW_MS
  history = history.filter((h) => h.t >= cutoff)
  saveHistory()
}

// Remove Markdown so the app shows clean plain text (no **, #, backticks, bullets).
function stripMarkdown(s) {
  if (typeof s !== 'string') return s
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .trim()
}

function averages24h() {
  const cutoff = Date.now() - AVG_WINDOW_MS
  const recent = history.filter((h) => h.t >= cutoff)
  if (recent.length === 0) {
    // Fallback to the latest reading until we have history
    return latestData.temperature == null
      ? null
      : { temperature: latestData.temperature, humidity: latestData.humidity, samples: 0 }
  }
  const sum = recent.reduce(
    (a, h) => ({ temperature: a.temperature + h.temperature, humidity: a.humidity + h.humidity }),
    { temperature: 0, humidity: 0 }
  )
  return {
    temperature: Math.round((sum.temperature / recent.length) * 10) / 10,
    humidity: Math.round((sum.humidity / recent.length) * 10) / 10,
    samples: recent.length,
  }
}

// --- SMS alerts (Twilio) -----------------------------------------------------
// Reaches farmers without a smartphone. Phone + on/off are configured from the
// app and persisted; alerts are throttled so they never spam.
const SMS_FILE = join(__dirname, 'sms-config.json')
const SMS_MIN_INTERVAL = 30 * 60 * 1000 // at most one alert per 30 min
let smsConfig = { enabled: false, phone: '' }
let smsState = { tempAlerted: false, humAlerted: false, lastSent: 0 }

// Basic-auth username/password: API key if provided, else Account SID + token.
function twilioAuth() {
  const user = config.TWILIO_API_KEY_SID || config.TWILIO_ACCOUNT_SID
  const pass = config.TWILIO_API_KEY_SECRET || config.TWILIO_AUTH_TOKEN
  return { user, pass }
}

// Configured when we have the Account SID (URL), a secret, and a sender
// (either a From number or a Messaging Service SID).
function smsConfigured() {
  const { pass } = twilioAuth()
  const sender = config.TWILIO_FROM || config.TWILIO_MESSAGING_SERVICE_SID
  return !!(config.TWILIO_ACCOUNT_SID && pass && sender)
}

function loadSmsConfig() {
  try {
    smsConfig = { ...smsConfig, ...JSON.parse(fs.readFileSync(SMS_FILE, 'utf8')) }
  } catch {}
}

function saveSmsConfig() {
  fs.writeFile(SMS_FILE, JSON.stringify(smsConfig), () => {})
}

async function sendSms(message, toOverride) {
  const to = toOverride || smsConfig.phone
  if (!smsConfigured() || !to) throw new Error('SMS non configuré (identifiants Twilio ou numéro manquant)')
  if (!String(config.TWILIO_ACCOUNT_SID).startsWith('AC')) {
    throw new Error("TWILIO_ACCOUNT_SID doit être l'Account SID (commence par AC), pas une clé API (SK).")
  }
  const { user, pass } = twilioAuth()
  const auth = Buffer.from(`${user}:${pass}`).toString('base64')
  // Prefer a Messaging Service (MG...) if provided, else a From number
  const params = { To: to, Body: message }
  if (config.TWILIO_MESSAGING_SERVICE_SID) params.MessagingServiceSid = config.TWILIO_MESSAGING_SERVICE_SID
  else params.From = config.TWILIO_FROM
  const body = new URLSearchParams(params)
  const r = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  )
  if (!r.ok) {
    const detail = await r.text()
    throw new Error(`Twilio ${r.status}: ${detail}`)
  }
  return r.json()
}

// Evaluate thresholds and send a throttled SMS on a new excursion.
function maybeSendSmsAlert() {
  if (!smsConfig.enabled || !smsConfig.phone || !smsConfigured()) return
  if (!latestData.connected || latestData.temperature == null) return
  const t = config.thresholds
  const msgs = []

  const outT = latestData.temperature < t.temperature.min || latestData.temperature > t.temperature.max
  if (outT && !smsState.tempAlerted) {
    msgs.push(`Temperature ${latestData.temperature}C (hors ${t.temperature.min}-${t.temperature.max})`)
    smsState.tempAlerted = true
  }
  if (!outT) smsState.tempAlerted = false

  const outH = latestData.humidity < t.humidity.min || latestData.humidity > t.humidity.max
  if (outH && !smsState.humAlerted) {
    msgs.push(`Humidite ${latestData.humidity}% (hors ${t.humidity.min}-${t.humidity.max})`)
    smsState.humAlerted = true
  }
  if (!outH) smsState.humAlerted = false

  const now = Date.now()
  if (msgs.length && now - smsState.lastSent > SMS_MIN_INTERVAL) {
    smsState.lastSent = now
    sendSms('AgriSmart alerte: ' + msgs.join(' ; ')).catch((e) => console.error('SMS:', e.message))
  }
}

// --- Simulation mode ---------------------------------------------------------
// Generates realistic values with a small random walk, centered on the healthy
// range but occasionally drifting out of bounds so alerts + AI can be tested.
let sim = {
  temperature: (config.thresholds.temperature.min + config.thresholds.temperature.max) / 2,
  humidity: (config.thresholds.humidity.min + config.thresholds.humidity.max) / 2,
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function simulateReading() {
  // Random walk: nudge each value a little each tick
  sim.temperature += (Math.random() - 0.5) * 2 // ±1 °C
  sim.humidity += (Math.random() - 0.5) * 4 // ±2 %

  // Keep values in a plausible band (a bit wider than the alert thresholds so
  // we sometimes trigger alerts)
  sim.temperature = Math.min(45, Math.max(5, sim.temperature))
  sim.humidity = Math.min(95, Math.max(15, sim.humidity))

  latestData = {
    temperature: round1(sim.temperature),
    humidity: round1(sim.humidity),
    connected: true,
    lastUpdate: new Date().toLocaleTimeString('fr-FR'),
  }
  recordHistory()
  maybeSendSmsAlert()
}

// Fetch data from ESP32 every 2 seconds
async function fetchFromESP32() {
  if (config.SIMULATE) {
    simulateReading()
    return
  }
  try {
    const response = await fetch(config.ESP32_URL, { timeout: 1500 })
    const data = await response.json()

    latestData = {
      temperature: data.temperature,
      humidity: data.humidite,
      connected: true,
      lastUpdate: new Date().toLocaleTimeString('fr-FR'),
    }
    recordHistory()
    maybeSendSmsAlert()
  } catch (error) {
    // ESP32 unreachable — mark as disconnected but keep last known values
    latestData.connected = false
    console.error('ESP32 unreachable:', error.message)
  }
}

// React app calls this endpoint to get sensor data + thresholds
app.get('/api/sensors', (req, res) => {
  res.json({
    ...latestData,
    thresholds: config.thresholds,
    avg24h: averages24h(),
  })
})

// Downsample an array to at most maxPoints, keeping order.
function downsample(arr, maxPoints) {
  if (arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  return arr.filter((_, i) => i % step === 0)
}

// History series for the charts. ?range=24h (default) | 7d
app.get('/api/history', (req, res) => {
  const sevenDays = req.query.range === '7d'
  const windowMs = sevenDays ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const cutoff = Date.now() - windowMs
  const series = history.filter((h) => h.t >= cutoff)
  const points = downsample(series, sevenDays ? 84 : 48).map((h) => ({
    t: h.t,
    temperature: h.temperature,
    humidity: h.humidity,
  }))
  res.json({ range: sevenDays ? '7d' : '24h', points, total: series.length })
})

// --- SMS endpoints ---
app.get('/api/sms/config', (req, res) => {
  res.json({ enabled: smsConfig.enabled, phone: smsConfig.phone, configured: smsConfigured() })
})

app.post('/api/sms/config', (req, res) => {
  const { enabled, phone } = req.body ?? {}
  if (typeof enabled === 'boolean') smsConfig.enabled = enabled
  if (typeof phone === 'string') smsConfig.phone = phone.trim()
  saveSmsConfig()
  res.json({ enabled: smsConfig.enabled, phone: smsConfig.phone, configured: smsConfigured() })
})

app.post('/api/sms/test', async (req, res) => {
  const phone = (req.body && req.body.phone) || smsConfig.phone
  if (!smsConfigured()) return res.status(503).json({ error: 'SMS non configuré sur le serveur (identifiants Twilio manquants)' })
  if (!phone) return res.status(400).json({ error: 'Numéro de téléphone manquant' })
  try {
    await sendSms("AgriSmart : ceci est un test d'alerte SMS. Tout fonctionne !", phone)
    res.json({ ok: true })
  } catch (e) {
    res.status(502).json({ error: 'Envoi échoué', detail: e.message })
  }
})

// AI recommendations — the app posts current sensor data, we ask OpenAI for
// concrete, actionable advice to help the farmer avoid crop losses.
app.post('/api/recommendations', async (req, res) => {
  const { temperature, humidity, crop, variety, region, zone, soil } = req.body ?? {}
  const t = config.thresholds

  if (temperature == null || humidity == null) {
    return res.status(400).json({ error: 'temperature and humidity are required' })
  }

  // Optional agronomic context — makes advice region/soil specific when provided
  const agro = [
    crop && `- Culture : ${crop}${variety ? ` (variété ${variety})` : ''}`,
    region && `- Région : ${region}`,
    zone && `- Zone climatique : ${zone}`,
    soil && `- Sol : ${soil}`,
  ].filter(Boolean).join('\n')

  const prompt = `Tu es un agronome qui conseille un petit agriculteur au Burkina Faso.
${agro ? `Contexte de la parcelle :\n${agro}\n` : ''}
Données actuelles du champ (capteurs IoT) :
- Température : ${temperature} °C (plage saine : ${t.temperature.min}–${t.temperature.max} °C)
- Humidité : ${humidity} % (plage saine : ${t.humidity.min}–${t.humidity.max} %)

Donne 2 à 3 recommandations courtes, concrètes et immédiates pour éviter les pertes de récolte.
Tiens compte de la zone climatique et du type de sol s'ils sont fournis.
Réponds en français simple. Format : une liste, chaque conseil en une phrase, commençant par un verbe d'action.
N'utilise AUCUN formatage Markdown : pas de **, pas de #, pas de gras ni de titres. Texte brut uniquement.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 300,
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? ''
    // Split the bullet/numbered list into clean strings for the app
    const tips = text
      .split('\n')
      .map((l) => stripMarkdown(l.replace(/^\s*[-*\d.)]+\s*/, '')))
      .filter(Boolean)

    res.json({ tips, raw: text, generatedAt: new Date().toISOString() })
  } catch (error) {
    console.error('OpenAI error:', error.message)
    res.status(502).json({ error: 'AI recommendation failed', detail: error.message })
  }
})

// Robustly pull a JSON object out of a model response (handles ```json fences).
function parseJsonLoose(text) {
  if (!text) return null
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

// Plant photo analysis with GPT-4o vision. Two modes:
//  - inspection: assess stage, anomaly, readiness + recommendations
//  - resolution: check whether a treated anomaly is now resolved
app.post('/api/inspection', async (req, res) => {
  const {
    imageBase64,
    cropType,
    variety,
    stageKey,
    stageRanges,
    temperature,
    humidity,
    mode = 'inspection',
    anomalyType,
    region,
    zone,
    soil,
  } = req.body ?? {}

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' })
  }

  const context = `Culture : ${cropType ?? '?'} (variété ${variety ?? '?'}).
Stade en cours : ${stageKey ?? '?'}.
Plages idéales pour ce stade : température ${stageRanges?.temp?.min ?? '?'}–${stageRanges?.temp?.max ?? '?'} °C, humidité ${stageRanges?.hum?.min ?? '?'}–${stageRanges?.hum?.max ?? '?'} %.
Moyenne des capteurs sur les dernières 24h : température ${temperature ?? 'inconnue'} °C, humidité ${humidity ?? 'inconnue'} %.${region ? `\nRégion : ${region}.` : ''}${zone ? `\nZone climatique : ${zone}.` : ''}${soil ? `\nSol : ${soil}.` : ''}`

  const inspectionPrompt = `Tu es un agronome expert. Analyse la photo de ce plant.
${context}

Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, avec ce schéma exact :
{
  "stade_detecte": string,
  "sante": "bonne" | "moyenne" | "mauvaise",
  "anomalie": { "presente": boolean, "type": string, "gravite": "faible" | "moyenne" | "élevée", "description": string },
  "pret_a_avancer": boolean,
  "recommandations": string[],
  "raison_blocage": string
}
RÈGLES STRICTES :
- Une "anomalie" est UNIQUEMENT un problème VISIBLE sur le plant dans la photo : maladie, ravageur/insecte, carence visible (décoloration, taches), pourriture, flétrissement, malformation du germe ou du feuillage. Si le plant a l'air sain sur la photo, "anomalie.presente" = false, même si la température ou l'humidité sont mauvaises.
- "anomalie.type" doit NOMMER précisément le diagnostic le plus probable (ex. "Cercosporiose", "Mildiou", "Rouille", "Pucerons", "Chenille légionnaire", "Carence en azote", "Brûlure bactérienne"), et PAS un symptôme vague comme "taches sur les feuilles". Si tu hésites entre plusieurs, donne le plus probable.
- "anomalie.description" : une phrase expliquant ce que tu observes, la cause probable, et ton niveau de certitude (ex. "Petites taches brunes cerclées de jaune, typiques de la cercosporiose ; diagnostic probable mais à confirmer").
- La température et l'humidité (capteurs) ne sont JAMAIS une anomalie. Une humidité/température hors plage ne doit JAMAIS mettre "anomalie.presente" à true, ni apparaître dans "raison_blocage", ni bloquer le passage de stade. Elles servent UNIQUEMENT à enrichir les "recommandations".
- "pret_a_avancer" et "raison_blocage" se basent EXCLUSIVEMENT sur l'état VISUEL du plant (a-t-il atteint les caractéristiques du stade ?) et sur la présence d'une anomalie visible. N'invoque jamais l'humidité ni la température dans "raison_blocage".
- "pret_a_avancer" = true si le plant a visuellement atteint les critères du stade ET qu'aucune anomalie visible n'est présente.
- N'utilise AUCUN Markdown dans les textes : pas de **, pas de #, texte brut.`

  const resolutionPrompt = `Tu es un agronome expert. Le plant présentait l'anomalie suivante : "${anomalyType}".
${context}
Le traitement a été appliqué. Regarde la nouvelle photo pour juger si l'anomalie est résolue.

RAISONNEMENT IMPORTANT :
- Une anomalie est RÉSOLUE quand ses symptômes ont DISPARU. Un plant qui paraît sain, SANS les symptômes de "${anomalyType}", signifie que le traitement a fonctionné → "resolved": true.
- N'exige PAS de voir le symptôme pour confirmer : l'ABSENCE de symptôme sur un plant d'aspect sain EST la preuve de la résolution.
- Réponds "resolved": false UNIQUEMENT si les symptômes de "${anomalyType}" sont ENCORE clairement visibles sur la photo.
- Si la photo est vraiment inexploitable (floue, sombre, ne montre pas le plant), réponds "resolved": false et explique-le dans "note".
- Ne refuse jamais : produis toujours le JSON.

Dans "note", explique brièvement ton verdict (ex. "Feuillage bien vert, plus de jaunissement : carence corrigée").

Réponds UNIQUEMENT par un objet JSON valide, sans texte autour :
{ "resolved": boolean, "note": string }`

  const prompt = mode === 'resolution' ? resolutionPrompt : inspectionPrompt

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      temperature: 0.3,
      response_format: { type: 'json_object' }, // force a valid JSON object (no plain-text refusals)
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const json = parseJsonLoose(text)
    if (!json) {
      // Graceful fallback so the app never shows a raw 502
      if (mode === 'resolution') {
        return res.json({ resolved: false, note: "L'IA n'a pas pu analyser cette photo. Réessaie avec une image nette et bien éclairée du plant." })
      }
      return res.status(502).json({ error: 'AI returned unparseable output', raw: text })
    }
    // Strip any stray Markdown from text fields before sending to the app
    if (Array.isArray(json.recommandations)) {
      json.recommandations = json.recommandations.map(stripMarkdown)
    }
    if (json.raison_blocage) json.raison_blocage = stripMarkdown(json.raison_blocage)
    if (json.note) json.note = stripMarkdown(json.note)
    if (json.anomalie) {
      if (json.anomalie.type) json.anomalie.type = stripMarkdown(json.anomalie.type)
      if (json.anomalie.description) json.anomalie.description = stripMarkdown(json.anomalie.description)
    }
    res.json(json)
  } catch (error) {
    console.error('OpenAI vision error:', error.message)
    res.status(502).json({ error: 'AI inspection failed', detail: error.message })
  }
})

// Detailed, CONTEXT-LOCKED explanation of an anomaly already diagnosed by the
// image analysis. The model must keep the same diagnosis and stay specific to
// the crop / stage / region — never give a generic, context-free answer.
app.post('/api/anomaly-details', async (req, res) => {
  const { anomalyType, description, severity, crop, variety, stage, region, zone, soil, health } = req.body ?? {}

  if (!anomalyType) {
    return res.status(400).json({ error: 'anomalyType is required' })
  }

  const ctx = [
    crop && `- Culture : ${crop}${variety ? ` (variété ${variety})` : ''}`,
    stage && `- Stade : ${stage}`,
    health && `- État général observé : ${health}`,
    region && `- Région : ${region}`,
    zone && `- Zone climatique : ${zone}`,
    soil && `- Sol : ${soil}`,
  ].filter(Boolean).join('\n')

  const prompt = `Tu es un agronome expert qui conseille un petit agriculteur au Burkina Faso.
Une analyse photo a déjà posé ce diagnostic, que tu dois CONSERVER tel quel (ne change pas de diagnostic, n'en invente pas un autre) :
- Diagnostic : ${anomalyType}${severity ? ` (gravité ${severity})` : ''}
${description ? `- Observation : ${description}` : ''}

Contexte précis de la parcelle (utilise-le dans TOUTES tes explications, reste spécifique à ce contexte) :
${ctx || '- (contexte limité)'}

Donne une explication approfondie de CE problème précis, adaptée à cette culture, ce stade et cette région.
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, avec ce schéma exact :
{
  "resume": string,            // 2-3 phrases expliquant ce qu'est ce problème pour cette culture
  "causes": string[],          // causes probables dans ce contexte
  "symptomes": string[],       // ce que l'agriculteur peut observer
  "traitement": string[],      // étapes de traitement concrètes et accessibles localement
  "prevention": string[],      // comment éviter que ça revienne
  "ressources": [ { "titre": string, "requete": string } ]  // 2-3 sujets à approfondir + une requête de recherche
}
Écris en français simple. N'utilise AUCUN Markdown (pas de **, pas de #), texte brut.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 900,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })
    const json = parseJsonLoose(completion.choices[0]?.message?.content ?? '')
    if (!json) return res.status(502).json({ error: 'AI returned unparseable output' })

    // Clean Markdown from every text field
    json.resume = stripMarkdown(json.resume)
    for (const k of ['causes', 'symptomes', 'traitement', 'prevention']) {
      if (Array.isArray(json[k])) json[k] = json[k].map(stripMarkdown)
    }
    if (Array.isArray(json.ressources)) {
      json.ressources = json.ressources.map((r) => ({ titre: stripMarkdown(r.titre), requete: r.requete }))
    }
    res.json(json)
  } catch (error) {
    console.error('OpenAI details error:', error.message)
    res.status(502).json({ error: 'AI details failed', detail: error.message })
  }
})

// Text-to-speech via ElevenLabs (realistic French voice). Returns the mp3 as
// base64 JSON so the app can cache + play it. The key stays on the server.
// If no key is configured, returns 503 and the app falls back to device TTS.
// Resolve a voice the account is actually allowed to use. Free plans can't use
// library voices, so we pick the first voice from the account's own list.
let cachedVoiceId = null
async function resolveVoiceId() {
  if (config.ELEVENLABS_VOICE_ID) return config.ELEVENLABS_VOICE_ID
  if (cachedVoiceId) return cachedVoiceId
  const r = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': config.ELEVENLABS_API_KEY },
  })
  if (!r.ok) throw new Error(`voices ${r.status}`)
  const data = await r.json()
  const v = data.voices?.[0]
  if (!v) throw new Error('aucune voix disponible sur ce compte ElevenLabs')
  cachedVoiceId = v.voice_id
  console.log(`ElevenLabs : voix auto-sélectionnée « ${v.name} » (${v.voice_id})`)
  return cachedVoiceId
}

app.post('/api/tts', async (req, res) => {
  const { text, voiceId } = req.body ?? {}
  if (!text) return res.status(400).json({ error: 'text is required' })
  if (!config.ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'ElevenLabs not configured' })
  }
  try {
    const voice = voiceId || (await resolveVoiceId())
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': config.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    })
    if (!r.ok) {
      const detail = await r.text()
      console.error('ElevenLabs error:', detail)
      return res.status(502).json({ error: 'tts failed', detail })
    }
    const buf = Buffer.from(await r.arrayBuffer())
    res.json({ audioBase64: buf.toString('base64') })
  } catch (error) {
    console.error('ElevenLabs error:', error.message)
    res.status(502).json({ error: 'tts failed', detail: error.message })
  }
})

// Restore persisted state before serving
loadHistory()
loadSmsConfig()

app.listen(config.SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${config.SERVER_PORT}`)
  if (config.SIMULATE) {
    console.log('🧪 MODE SIMULATION — données capteurs générées (pas d\'ESP32)')
  } else {
    console.log(`Fetching from ESP32 at ${config.ESP32_URL}`)
  }
  console.log(`SMS (Twilio) : ${smsConfigured() ? 'configuré' : 'non configuré'} · alertes ${smsConfig.enabled ? 'activées' : 'désactivées'}`)
})

// Start polling immediately then every 2 seconds
fetchFromESP32()
setInterval(fetchFromESP32, 2000)
