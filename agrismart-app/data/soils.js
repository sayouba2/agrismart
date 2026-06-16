// Soil reference for Burkina Faso. Used to (1) pre-select the likely soil from
// the chosen region and (2) feed the AI with soil-aware context for advice.

export const SOILS = {
  ferrugineux: {
    key: 'ferrugineux',
    label: 'Sols ferrugineux tropicaux',
    texture: 'Sablo-limoneuse, peu profonds',
    fertility: 'Faible, s\'appauvrit vite, risque d\'induration (carapace)',
    crops: 'Mil, sorgho, arachide, maïs',
    amendment: 'Apporter compost / fumure organique régulière ; éviter le sol nu pour limiter l\'induration.',
  },
  ferralitiques: {
    key: 'ferralitiques',
    label: 'Sols ferrallitiques',
    texture: 'Profonds, excellente structure physique',
    fertility: 'Chimiquement pauvres mais bien structurés',
    crops: 'Maïs, coton, vergers (manguier, anacardier)',
    amendment: 'Phosphate naturel du Burkina + matière organique pour corriger la pauvreté chimique.',
  },
  vertisols: {
    key: 'vertisols',
    label: 'Vertisols (argileux noirs)',
    texture: 'Argileuse lourde : collante humide, craquelée sèche',
    fertility: 'Riche et profonde',
    crops: 'Coton, maraîchage, céréales exigeantes',
    amendment: 'Travailler à bonne humidité, soigner le drainage ; très productif si bien géré.',
  },
  hydromorphes: {
    key: 'hydromorphes',
    label: 'Sols hydromorphes (bas-fonds)',
    texture: 'Gorgés d\'eau une partie de l\'année',
    fertility: 'Riche en matière organique',
    crops: 'Riz, maraîchage de saison sèche',
    amendment: 'Maîtriser le drainage ; idéaux pour la riziculture et le maraîchage.',
  },
  isohumiques: {
    key: 'isohumiques',
    label: 'Sols isohumiques (bruns subarides)',
    texture: 'Sableuse (sables éoliens)',
    fertility: 'Très variable',
    crops: 'Pâturage, cultures de décrue',
    amendment: 'Fumure organique et lutte anti-érosion éolienne (haies, paillage).',
  },
  brunifies: {
    key: 'brunifies',
    label: 'Sols brunifiés eutrophes',
    texture: 'Sur roches basiques',
    fertility: 'Bonne fertilité naturelle',
    crops: 'Agriculture intensive',
    amendment: 'Entretenir le taux de matière organique pour maintenir la fertilité.',
  },
  mineraux_bruts: {
    key: 'mineraux_bruts',
    label: 'Sols minéraux bruts / peu évolués',
    texture: 'Minces, sur cuirasse latéritique',
    fertility: 'Pauvre, sensible à l\'érosion',
    crops: 'Limité (parcours, cultures de niche)',
    amendment: 'Cordons pierreux, zaï, demi-lunes pour restaurer et retenir l\'eau.',
  },
  halomorphes: {
    key: 'halomorphes',
    label: 'Sols halomorphes (salés)',
    texture: 'Forte salinité',
    fertility: 'Contrainte saline marquée',
    crops: 'Limité',
    amendment: 'Drainage, apport de gypse, choisir des plantes tolérantes au sel.',
  },
}

export const SOIL_LIST = Object.values(SOILS)

export function getSoil(key) {
  return SOILS[key] ?? null
}
