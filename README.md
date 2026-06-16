# 🌱 AgriSmart

Application d'agriculture intelligente pour le Burkina Faso : capteurs IoT en temps réel, recommandations IA, suivi des cultures par stade avec analyse photo des anomalies, météo, historique et alertes SMS.

Le projet a **deux parties** :

| Dossier | Rôle |
|---|---|
| `server/` | Serveur Node.js — relaie les données du capteur (ou les simule) et appelle les IA (OpenAI, ElevenLabs, Twilio). |
| `agrismart-app/` | Application mobile **Expo / React Native** (SDK 54). |

---

## ✅ Prérequis (macOS)

1. **Node.js 20 LTS** — vérifie avec `node -v`. Sinon, installe-le :
   ```bash
   brew install node@20
   ```
   (ou télécharge sur [nodejs.org](https://nodejs.org)).
2. **Application Expo Go** sur ton iPhone/Android (depuis l'App Store / Play Store) — c'est avec elle qu'on teste l'app.
3. Ton **téléphone et ton Mac doivent être sur le même réseau WiFi**.

> Pas besoin de Xcode ni Android Studio : on lance l'app directement sur ton téléphone via Expo Go.

---

## 1️⃣ Démarrer le serveur

```bash
cd server
npm install
```

Crée le fichier **`server/.env`** (au même endroit que `config.js`) avec au minimum :

```env
# Mode dev : true = données simulées (aucun capteur requis)
SIMULATE=true

# IP du capteur ESP32 (ignoré si SIMULATE=true)
ESP32_IP=192.168.1.50
SERVER_PORT=3000

# Seuils d'alerte capteurs
TEMP_MIN=10
TEMP_MAX=30
HUM_MIN=30
HUM_MAX=60

# OpenAI — REQUIS pour les recommandations et l'analyse photo
OPENAI_API_KEY=sk-...

# ElevenLabs — OPTIONNEL (voix réaliste). Vide = voix du téléphone
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# Twilio — OPTIONNEL (alertes SMS). Vide = SMS désactivés
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_FROM=
```

> 💡 Seule la clé **OpenAI** est nécessaire pour démarrer. ElevenLabs et Twilio sont optionnels (l'app fonctionne sans).

Lance le serveur :

```bash
npm start
```

Tu devrais voir :
```
Server running on http://localhost:3000
🧪 MODE SIMULATION — données capteurs générées (pas d'ESP32)
```
Laisse ce terminal ouvert.

---

## 2️⃣ Démarrer l'application

Ouvre un **second terminal** :

```bash
cd agrismart-app
npm install
```

**Important** — indique l'adresse de ton Mac à l'app. Récupère ton IP locale :

```bash
ipconfig getifaddr en0   # WiFi sur Mac
```

Ouvre **`agrismart-app/config.js`** et mets cette IP :

```js
export const SERVER_URL = 'http://TON_IP_ICI:3000'   // ex. http://192.168.1.20:3000
```

Puis lance Expo :

```bash
npm start
```

---

## 📱 Tester sur ton téléphone

1. Un **QR code** s'affiche dans le terminal.
2. Scanne-le avec l'app **Expo Go** (Android) ou l'**appareil photo** (iPhone).
3. L'app se charge sur ton téléphone. À la première ouverture, l'assistant te guide pour créer ta culture.

---

## 🔧 Dépannage rapide

| Problème | Solution |
|---|---|
| L'app affiche « Serveur injoignable » | Vérifie que `SERVER_URL` dans `agrismart-app/config.js` est bien l'IP de ton Mac, et que téléphone + Mac sont sur le **même WiFi**. |
| L'IP de ton Mac a changé | Mets à jour `SERVER_URL` dans `agrismart-app/config.js`. |
| `EADDRINUSE` au démarrage du serveur | Un serveur tourne déjà : `pkill -f 'node server.js'` puis `npm start`. |
| Erreur de bundle / cache | `npx expo start --clear` dans `agrismart-app/`. |
| Les IA ne répondent pas | Vérifie `OPENAI_API_KEY` dans `server/.env` et redémarre le serveur. |

---

## 🗂️ Résumé des commandes

```bash
# Terminal 1 — serveur
cd server && npm install && npm start

# Terminal 2 — app
cd agrismart-app && npm install && npm start
```
