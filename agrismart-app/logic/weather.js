// Weather via Open-Meteo (free, no API key). Called directly from the app.

const WMO = {
  0: { label: 'Ciel dégagé', icon: 'sun' },
  1: { label: 'Peu nuageux', icon: 'sun' },
  2: { label: 'Partiellement nuageux', icon: 'cloud' },
  3: { label: 'Couvert', icon: 'cloud' },
  45: { label: 'Brouillard', icon: 'cloud' },
  48: { label: 'Brouillard givrant', icon: 'cloud' },
  51: { label: 'Bruine légère', icon: 'cloud-drizzle' },
  53: { label: 'Bruine', icon: 'cloud-drizzle' },
  55: { label: 'Bruine dense', icon: 'cloud-drizzle' },
  61: { label: 'Pluie légère', icon: 'cloud-rain' },
  63: { label: 'Pluie', icon: 'cloud-rain' },
  65: { label: 'Pluie forte', icon: 'cloud-rain' },
  80: { label: 'Averses', icon: 'cloud-rain' },
  81: { label: 'Averses', icon: 'cloud-rain' },
  82: { label: 'Averses violentes', icon: 'cloud-rain' },
  95: { label: 'Orage', icon: 'cloud-lightning' },
  96: { label: 'Orage (grêle)', icon: 'cloud-lightning' },
  99: { label: 'Orage violent', icon: 'cloud-lightning' },
}

export function weatherInfo(code) {
  return WMO[code] || { label: '—', icon: 'cloud' }
}

export async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto&forecast_days=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const d = await res.json()
  return {
    current: {
      temp: Math.round(d.current.temperature_2m),
      humidity: Math.round(d.current.relative_humidity_2m),
      precip: d.current.precipitation,
      code: d.current.weather_code,
    },
    daily: d.daily.time.map((t, i) => ({
      date: t,
      code: d.daily.weather_code[i],
      tmax: Math.round(d.daily.temperature_2m_max[i]),
      tmin: Math.round(d.daily.temperature_2m_min[i]),
      precip: Math.round(d.daily.precipitation_sum[i] * 10) / 10,
    })),
  }
}

// Short agronomic note from the next 3 days of forecast.
export function weatherAdvice(daily) {
  const next3 = daily.slice(1, 4)
  const rain = next3.reduce((a, d) => a + (d.precip || 0), 0)
  if (rain >= 10) return 'Pluie attendue les prochains jours — réduis l\'irrigation.'
  if (rain === 0 && next3.every((d) => d.tmax >= 35)) return 'Temps chaud et sec — surveille le stress hydrique.'
  return null
}
