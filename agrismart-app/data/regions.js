// Burkina Faso — 17 régions (réforme territoriale 2025, toponymes endogènes).
// Chaque région porte sa zone climatique et ses sols dominants (le 1er = principal).
// Sources : BUNASOLS, présidence du Faso (juillet 2025).

export const ZONES = {
  sahelienne: {
    key: 'sahelienne',
    label: 'Sahélienne',
    note: 'Climat aride, pluviométrie faible. Privilégier les variétés à cycle très court, résistantes à la sécheresse, et les techniques de collecte d\'eau (zaï, demi-lunes, cordons pierreux).',
  },
  soudano_sahelienne: {
    key: 'soudano_sahelienne',
    label: 'Soudano-sahélienne',
    note: 'Pluviométrie moyenne et irrégulière. Gestion fine de l\'eau et apport de fumure organique fortement recommandés.',
  },
  soudanienne: {
    key: 'soudanienne',
    label: 'Soudanienne',
    note: 'Zone la plus arrosée du pays. Adaptée au maïs, au coton et à l\'arboriculture fruitière.',
  },
}

export const REGIONS = [
  { key: 'bankui', name: 'Bankui', oldName: 'Boucle du Mouhoun', chefLieu: 'Dédougou', zone: 'soudano_sahelienne', soils: ['vertisols', 'ferrugineux', 'hydromorphes'], lat: 12.46, lon: -3.46 },
  { key: 'sourou', name: 'Sourou', oldName: 'ex-Boucle du Mouhoun', chefLieu: 'Tougan', zone: 'soudano_sahelienne', soils: ['vertisols', 'hydromorphes'], lat: 13.07, lon: -3.07 },
  { key: 'guiriko', name: 'Guiriko', oldName: 'Hauts-Bassins', chefLieu: 'Bobo-Dioulasso', zone: 'soudanienne', soils: ['ferralitiques', 'brunifies', 'hydromorphes'], lat: 11.18, lon: -4.3 },
  { key: 'tannounyan', name: 'Tannounyan', oldName: 'Cascades', chefLieu: 'Banfora', zone: 'soudanienne', soils: ['ferralitiques', 'hydromorphes'], lat: 10.63, lon: -4.77 },
  { key: 'djoro', name: 'Djôrô', oldName: 'Sud-Ouest', chefLieu: 'Gaoua', zone: 'soudanienne', soils: ['ferralitiques', 'brunifies'], lat: 10.3, lon: -3.18 },
  { key: 'yaagda', name: 'Yaagda', oldName: 'Nord', chefLieu: 'Ouahigouya', zone: 'soudano_sahelienne', soils: ['ferrugineux', 'hydromorphes'], lat: 13.58, lon: -2.42 },
  { key: 'nando', name: 'Nando', oldName: 'Centre-Ouest', chefLieu: 'Koudougou', zone: 'soudano_sahelienne', soils: ['ferrugineux', 'hydromorphes'], lat: 12.25, lon: -2.36 },
  { key: 'kadiogo', name: 'Kadiogo', oldName: 'Centre', chefLieu: 'Ouagadougou', zone: 'soudano_sahelienne', soils: ['ferrugineux'], lat: 12.37, lon: -1.52 },
  { key: 'nazinon', name: 'Nazinon', oldName: 'Centre-Sud', chefLieu: 'Manga', zone: 'soudanienne', soils: ['ferrugineux', 'brunifies'], lat: 11.66, lon: -1.07 },
  { key: 'oubritenga', name: 'Oubritenga', oldName: 'Plateau-Central', chefLieu: 'Ziniaré', zone: 'soudano_sahelienne', soils: ['ferrugineux'], lat: 12.58, lon: -1.3 },
  { key: 'kuilse', name: 'Kuilsé', oldName: 'Centre-Nord', chefLieu: 'Kaya', zone: 'soudano_sahelienne', soils: ['ferrugineux', 'hydromorphes'], lat: 13.09, lon: -1.08 },
  { key: 'nakambe', name: 'Nakambé', oldName: 'Centre-Est', chefLieu: 'Tenkodogo', zone: 'soudano_sahelienne', soils: ['ferrugineux', 'hydromorphes'], lat: 11.78, lon: -0.37 },
  { key: 'liptako', name: 'Liptako', oldName: 'Sahel', chefLieu: 'Dori', zone: 'sahelienne', soils: ['isohumiques', 'mineraux_bruts', 'halomorphes'], lat: 14.03, lon: -0.03 },
  { key: 'soum', name: 'Soum', oldName: 'ex-Sahel', chefLieu: 'Djibo', zone: 'sahelienne', soils: ['isohumiques', 'mineraux_bruts'], lat: 14.1, lon: -1.63 },
  { key: 'goulmou', name: 'Goulmou', oldName: 'Est', chefLieu: "Fada N'Gourma", zone: 'soudanienne', soils: ['ferrugineux', 'ferralitiques'], lat: 12.06, lon: 0.36 },
  { key: 'tapoa', name: 'Tapoa', oldName: 'ex-Est', chefLieu: 'Diapaga', zone: 'soudanienne', soils: ['ferrugineux'], lat: 12.07, lon: 1.79 },
  { key: 'sirba', name: 'Sirba', oldName: 'ex-Est', chefLieu: 'Bogandé', zone: 'soudano_sahelienne', soils: ['ferrugineux'], lat: 12.97, lon: -0.14 },
]

export function getRegion(key) {
  return REGIONS.find((r) => r.key === key) ?? null
}

export function getZone(key) {
  return ZONES[key] ?? null
}
