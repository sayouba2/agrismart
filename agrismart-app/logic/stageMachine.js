// Pure rules for the stage state machine. No DB, no UI — easy to reason about.

// Can the farmer move to the next stage?
// Two conditions (the user's rules):
//   1. The AI confirmed the stage criteria are met (ready_to_advance)
//   2. No anomaly of the current stage is still open/monitoring
export function canAdvance(verdict, openAnomalies) {
  const ready = verdict?.pret_a_avancer === true
  const blockingCount = openAnomalies?.length ?? 0

  if (blockingCount > 0) {
    return {
      allowed: false,
      reason: `${blockingCount} anomalie(s) à résoudre avant de passer au stade suivant.`,
    }
  }
  if (!ready) {
    return {
      allowed: false,
      reason: verdict?.raison_blocage || "Les critères du stade ne sont pas encore atteints.",
    }
  }
  return { allowed: true, reason: 'Critères atteints et aucune anomalie active.' }
}

// Build anomaly rows to persist from an inspection verdict.
export function anomaliesFromVerdict(verdict) {
  if (!verdict?.anomalie?.presente) return []
  return [
    {
      type: verdict.anomalie.type || 'Anomalie détectée',
      severity: verdict.anomalie.gravite || 'inconnue',
      // The first recommendation usually doubles as the treatment to apply
      treatment: (verdict.recommandations && verdict.recommandations[0]) || null,
    },
  ]
}

// Did the resolution photo confirm the anomaly is gone?
export function isResolved(resolutionVerdict) {
  return resolutionVerdict?.resolved === true
}

// Visual status for a stage in the timeline.
export function stageVisualStatus(stage) {
  return stage.status // 'done' | 'active' | 'locked'
}
