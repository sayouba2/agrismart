// Turn raw sensor data + thresholds into a list of alerts the UI can show.
// Each alert: { level: 'danger' | 'ok', metric, message }

export function evaluateAlerts(data) {
  if (!data) return []

  const alerts = []
  const { temperature, humidity, connected, thresholds } = data

  if (!connected) {
    alerts.push({
      level: 'danger',
      metric: 'connexion',
      message: 'Capteur déconnecté — données peut-être périmées.',
    })
  }

  alerts.push(checkRange('Température', temperature, thresholds?.temperature, '°C'))
  alerts.push(checkRange('Humidité', humidity, thresholds?.humidity, '%'))

  return alerts.filter(Boolean)
}

function checkRange(label, value, range, unit) {
  if (value == null || !range) return null

  if (value < range.min) {
    return {
      level: 'danger',
      metric: label.toLowerCase(),
      message: `${label} trop basse (${value}${unit}, min ${range.min}${unit}).`,
    }
  }
  if (value > range.max) {
    return {
      level: 'danger',
      metric: label.toLowerCase(),
      message: `${label} trop élevée (${value}${unit}, max ${range.max}${unit}).`,
    }
  }
  return {
    level: 'ok',
    metric: label.toLowerCase(),
    message: `${label} normale (${value}${unit}).`,
  }
}

// Convenience: is a single value within its healthy range?
export function statusOf(value, range) {
  if (value == null || !range) return 'unknown'
  if (value < range.min || value > range.max) return 'danger'
  return 'ok'
}
