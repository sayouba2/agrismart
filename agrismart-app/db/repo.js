import { getDb } from './schema'
import { getCrop } from '../data/crops'

const now = () => new Date().toISOString()

// --- Profile -----------------------------------------------------------------

// Create the crop profile AND seed its stages from the crop reference.
// The first stage is 'active', the rest 'locked'.
export async function createProfile(profile) {
  const db = await getDb()
  const res = await db.runAsync(
    `INSERT INTO crop_profile
       (crop_type, variety, planting_date, region, soil_type, irrigation, area, sensor_id, current_stage_index, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      profile.crop_type,
      profile.variety ?? null,
      profile.planting_date ?? null,
      profile.region ?? null,
      profile.soil_type ?? null,
      profile.irrigation ?? null,
      profile.area ?? null,
      profile.sensor_id ?? null,
      now(),
    ]
  )
  const profileId = res.lastInsertRowId

  const crop = getCrop(profile.crop_type)
  for (let i = 0; i < crop.stages.length; i++) {
    const s = crop.stages[i]
    await db.runAsync(
      `INSERT INTO stages (profile_id, key, label, order_index, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [profileId, s.key, s.label, i, i === 0 ? 'active' : 'locked', i === 0 ? now() : null]
    )
  }
  await setActiveProfile(profileId) // a newly created culture becomes the active one
  return profileId
}

// Return the active culture (fallback to the most recent for legacy installs).
export async function getProfile() {
  const db = await getDb()
  return (
    (await db.getFirstAsync(`SELECT * FROM crop_profile WHERE is_active = 1 ORDER BY id DESC LIMIT 1`)) ||
    (await db.getFirstAsync(`SELECT * FROM crop_profile ORDER BY id DESC LIMIT 1`))
  )
}

// All cultures, newest first.
export async function getProfiles() {
  const db = await getDb()
  return db.getAllAsync(`SELECT * FROM crop_profile ORDER BY id DESC`)
}

// Make one culture the active one (exclusive).
export async function setActiveProfile(id) {
  const db = await getDb()
  await db.runAsync(`UPDATE crop_profile SET is_active = 0`)
  await db.runAsync(`UPDATE crop_profile SET is_active = 1 WHERE id = ?`, [id])
}

// Delete a culture and all its data; keep one culture active if any remain.
export async function deleteProfile(id) {
  const db = await getDb()
  const stages = await db.getAllAsync(`SELECT id FROM stages WHERE profile_id = ?`, [id])
  for (const s of stages) {
    await db.runAsync(`DELETE FROM anomalies WHERE stage_id = ?`, [s.id])
    await db.runAsync(`DELETE FROM inspections WHERE stage_id = ?`, [s.id])
  }
  await db.runAsync(`DELETE FROM stages WHERE profile_id = ?`, [id])
  await db.runAsync(`DELETE FROM crop_profile WHERE id = ?`, [id])

  const active = await db.getFirstAsync(`SELECT id FROM crop_profile WHERE is_active = 1 LIMIT 1`)
  if (!active) {
    const next = await db.getFirstAsync(`SELECT id FROM crop_profile ORDER BY id DESC LIMIT 1`)
    if (next) await db.runAsync(`UPDATE crop_profile SET is_active = 1 WHERE id = ?`, [next.id])
  }
}

// --- Stages ------------------------------------------------------------------

export async function getStages(profileId) {
  const db = await getDb()
  return db.getAllAsync(
    `SELECT * FROM stages WHERE profile_id = ? ORDER BY order_index ASC`,
    [profileId]
  )
}

export async function getCurrentStage(profile) {
  const db = await getDb()
  return db.getFirstAsync(
    `SELECT * FROM stages WHERE profile_id = ? AND order_index = ?`,
    [profile.id, profile.current_stage_index]
  )
}

// Mark current stage done, unlock + activate the next one, bump profile index.
export async function advanceStage(profile) {
  const db = await getDb()
  const stages = await getStages(profile.id)
  const currentIndex = profile.current_stage_index
  const nextIndex = currentIndex + 1

  const current = stages.find((s) => s.order_index === currentIndex)
  if (current) {
    await db.runAsync(
      `UPDATE stages SET status = 'done', completed_at = ? WHERE id = ?`,
      [now(), current.id]
    )
  }

  const next = stages.find((s) => s.order_index === nextIndex)
  if (next) {
    await db.runAsync(
      `UPDATE stages SET status = 'active', started_at = ? WHERE id = ?`,
      [now(), next.id]
    )
    await db.runAsync(
      `UPDATE crop_profile SET current_stage_index = ? WHERE id = ?`,
      [nextIndex, profile.id]
    )
  }
  return next ?? null // null means the crop cycle is complete
}

// --- Inspections -------------------------------------------------------------

export async function addInspection(stageId, data) {
  const db = await getDb()
  const res = await db.runAsync(
    `INSERT INTO inspections
       (stage_id, photo_uri, temperature, humidity, verdict_json, detected_stage, health, ready_to_advance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      stageId,
      data.photo_uri ?? null,
      data.temperature ?? null,
      data.humidity ?? null,
      data.verdict_json ?? null,
      data.detected_stage ?? null,
      data.health ?? null,
      data.ready_to_advance ? 1 : 0,
      now(),
    ]
  )
  return res.lastInsertRowId
}

export async function getInspections(stageId) {
  const db = await getDb()
  return db.getAllAsync(
    `SELECT * FROM inspections WHERE stage_id = ? ORDER BY id DESC`,
    [stageId]
  )
}

export async function getInspection(id) {
  if (id == null) return null
  const db = await getDb()
  return db.getFirstAsync(`SELECT * FROM inspections WHERE id = ?`, [id])
}

// --- Anomalies ---------------------------------------------------------------

export async function addAnomaly(stageId, inspectionId, anomaly) {
  const db = await getDb()
  const res = await db.runAsync(
    `INSERT INTO anomalies (stage_id, inspection_id, type, severity, treatment, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    [stageId, inspectionId ?? null, anomaly.type, anomaly.severity ?? null, anomaly.treatment ?? null, now()]
  )
  return res.lastInsertRowId
}

// Anomalies that still block stage progression (open or under monitoring).
export async function openAnomaliesForStage(stageId) {
  const db = await getDb()
  return db.getAllAsync(
    `SELECT * FROM anomalies WHERE stage_id = ? AND status != 'resolved' ORDER BY id DESC`,
    [stageId]
  )
}

export async function getAnomaly(id) {
  const db = await getDb()
  return db.getFirstAsync(`SELECT * FROM anomalies WHERE id = ?`, [id])
}

// Cache the AI's detailed explanation so we don't re-call (and re-bill) it.
export async function saveAnomalyDetails(id, details) {
  const db = await getDb()
  await db.runAsync(`UPDATE anomalies SET details_json = ? WHERE id = ?`, [JSON.stringify(details), id])
}

export async function getAllAnomalies(stageId) {
  const db = await getDb()
  return db.getAllAsync(
    `SELECT * FROM anomalies WHERE stage_id = ? ORDER BY id DESC`,
    [stageId]
  )
}

export async function resolveAnomaly(anomalyId, resolutionPhotoUri) {
  const db = await getDb()
  await db.runAsync(
    `UPDATE anomalies SET status = 'resolved', resolved_at = ?, resolution_photo_uri = ? WHERE id = ?`,
    [now(), resolutionPhotoUri ?? null, anomalyId]
  )
}

export async function setAnomalyMonitoring(anomalyId) {
  const db = await getDb()
  await db.runAsync(`UPDATE anomalies SET status = 'monitoring' WHERE id = ?`, [anomalyId])
}
