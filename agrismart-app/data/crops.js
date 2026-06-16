// Crop reference data — drives the whole app.
// Each crop has an ordered list of growth stages. Each stage carries its typical
// duration and the ideal temperature/humidity ranges, which we pass to the AI so
// recommendations are specific to the crop AND the current stage.

export const CROPS = {
  tomate: {
    key: 'tomate',
    label: 'Tomate',
    emoji: '🍅',
    varieties: [],
    stages: [
      {
        key: 'germination',
        label: 'Germination',
        durationDays: 7,
        temp: { min: 20, max: 30 },
        hum: { min: 60, max: 85 },
        commonAnomalies: ['fonte des semis', 'graines non germées', 'excès d\'eau'],
      },
      {
        key: 'plantule',
        label: 'Plantule',
        durationDays: 21,
        temp: { min: 18, max: 28 },
        hum: { min: 50, max: 70 },
        commonAnomalies: ['étiolement', 'jaunissement', 'pucerons'],
      },
      {
        key: 'vegetatif',
        label: 'Croissance végétative',
        durationDays: 30,
        temp: { min: 18, max: 30 },
        hum: { min: 50, max: 70 },
        commonAnomalies: ['mildiou', 'carence en azote', 'aleurodes'],
      },
      {
        key: 'floraison',
        label: 'Floraison',
        durationDays: 20,
        temp: { min: 18, max: 28 },
        hum: { min: 50, max: 65 },
        commonAnomalies: ['chute des fleurs', 'carence en bore', 'stress hydrique'],
      },
      {
        key: 'fructification',
        label: 'Fructification',
        durationDays: 35,
        temp: { min: 18, max: 27 },
        hum: { min: 50, max: 65 },
        commonAnomalies: ['cul noir (carence calcium)', 'éclatement des fruits', 'pourriture'],
      },
      {
        key: 'recolte',
        label: 'Récolte',
        durationDays: 15,
        temp: { min: 16, max: 28 },
        hum: { min: 45, max: 60 },
        commonAnomalies: ['fruits abîmés', 'maturité inégale'],
      },
    ],
  },

  mais: {
    key: 'mais',
    label: 'Maïs',
    emoji: '🌽',
    // Variétés hybrides améliorées diffusées au Burkina (INERA / semenciers locaux)
    varieties: [
      { key: 'komsaya', label: 'Komsaya', note: 'Hybride très précoce (85–95 j), grain jaune corné-denté, très haut rendement.' },
      { key: 'kabako', label: 'Kabako', note: 'Hybride populaire, bonne sécurité alimentaire.' },
      { key: 'sanem', label: 'Sanem', note: 'Hybride productif, adapté aux conditions sahéliennes.' },
      { key: 'bondofa', label: 'Bondofa', note: 'Hybride largement diffusé, optimise les rendements.' },
      { key: 'semax', label: 'SEMAX', note: 'Hybride corné-denté, grain orangé-jaune, haute qualité.' },
    ],
    stages: [
      { key: 'germination', label: 'Germination', durationDays: 8, temp: { min: 18, max: 32 }, hum: { min: 55, max: 80 }, commonAnomalies: ['levée irrégulière', 'oiseaux', 'excès d\'eau'] },
      { key: 'levee', label: 'Levée', durationDays: 14, temp: { min: 18, max: 30 }, hum: { min: 50, max: 70 }, commonAnomalies: ['jaunissement', 'chenilles légionnaires'] },
      { key: 'vegetatif', label: 'Croissance végétative', durationDays: 40, temp: { min: 20, max: 32 }, hum: { min: 50, max: 70 }, commonAnomalies: ['carence en azote', 'striure', 'pucerons'] },
      { key: 'floraison', label: 'Floraison (épiaison)', durationDays: 20, temp: { min: 20, max: 30 }, hum: { min: 50, max: 70 }, commonAnomalies: ['stress hydrique', 'mauvaise pollinisation'] },
      { key: 'remplissage', label: 'Remplissage du grain', durationDays: 35, temp: { min: 18, max: 30 }, hum: { min: 45, max: 65 }, commonAnomalies: ['grains avortés', 'charançons'] },
      { key: 'recolte', label: 'Maturité / Récolte', durationDays: 15, temp: { min: 16, max: 30 }, hum: { min: 40, max: 60 }, commonAnomalies: ['moisissure des épis', 'verse'] },
    ],
  },

  oignon: {
    key: 'oignon',
    label: 'Oignon',
    emoji: '🧅',
    varieties: [],
    stages: [
      { key: 'germination', label: 'Germination', durationDays: 10, temp: { min: 15, max: 28 }, hum: { min: 60, max: 80 }, commonAnomalies: ['fonte des semis', 'levée faible'] },
      { key: 'plantule', label: 'Plantule', durationDays: 30, temp: { min: 14, max: 26 }, hum: { min: 55, max: 75 }, commonAnomalies: ['thrips', 'jaunissement', 'mildiou'] },
      { key: 'bulbaison', label: 'Bulbaison', durationDays: 45, temp: { min: 16, max: 28 }, hum: { min: 45, max: 65 }, commonAnomalies: ['pourriture du bulbe', 'carence', 'thrips'] },
      { key: 'maturation', label: 'Maturation', durationDays: 20, temp: { min: 16, max: 30 }, hum: { min: 40, max: 60 }, commonAnomalies: ['montaison (floraison prématurée)', 'pourriture'] },
      { key: 'recolte', label: 'Récolte / Séchage', durationDays: 15, temp: { min: 18, max: 32 }, hum: { min: 35, max: 55 }, commonAnomalies: ['bulbes abîmés', 'mauvais séchage'] },
    ],
  },
}

// List for pickers
export const CROP_LIST = Object.values(CROPS)

export const SOIL_TYPES = ['Sableux', 'Argileux', 'Limoneux', 'Sablo-argileux']
export const IRRIGATION_TYPES = ['Goutte-à-goutte', 'Aspersion', 'Pluvial', 'Manuel']

// Helpers
export function getCrop(cropKey) {
  return CROPS[cropKey] ?? null
}

export function getStageDef(cropKey, stageIndex) {
  return CROPS[cropKey]?.stages[stageIndex] ?? null
}
