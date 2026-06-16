import { getCrop } from '../data/crops'
import { getRegion, getZone } from '../data/regions'
import { getSoil } from '../data/soils'

// Build a compact agronomic context from the stored profile, sent to the AI so
// recommendations are specific to the crop, region, climate zone and soil.
export function buildAgroContext(profile) {
  if (!profile) return {}
  const crop = getCrop(profile.crop_type)
  const region = getRegion(profile.region)
  const zone = region ? getZone(region.zone) : null
  const soil = getSoil(profile.soil_type)

  return {
    crop: crop?.label,
    variety: profile.variety,
    region: region ? `${region.name} (ex-${region.oldName}, ${region.chefLieu})` : null,
    zone: zone ? `${zone.label} — ${zone.note}` : null,
    soil: soil ? `${soil.label} : ${soil.fertility}. ${soil.amendment}` : null,
  }
}
