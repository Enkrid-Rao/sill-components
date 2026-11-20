// 独立天气卡：温度、天气图标、体感范围。
const ICONS = {
  clear:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
  cloud:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a3.4 3.4 0 0 0 .3-6.8A5.2 5.2 0 0 0 7.4 10 3.9 3.9 0 0 0 7 18Z"/></svg>',
  rain:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10a3.2 3.2 0 0 0 .2-6.4A5 5 0 0 0 7.5 7.4 3.7 3.7 0 0 0 7 15Z"/><path d="M9 18.4l-.8 2M13 18.4l-.8 2M17 18.4l-.8 2"/></svg>',
  snow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M7 14h10a3.2 3.2 0 0 0 .2-6.4A5 5 0 0 0 7.5 6.4 3.7 3.7 0 0 0 7 14Z"/><path d="M9 18h.01M13 20h.01M17 18h.01M11 21h.01M15 17h.01"/></svg>',
  thunder:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14h10a3.2 3.2 0 0 0 .2-6.4A5 5 0 0 0 7.5 6.4 3.7 3.7 0 0 0 7 14Z"/><path d="M12.5 16.5 10.5 20h2.2l-1 2.4"/></svg>',
  fog:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4 10h16M6 13.5h12M4 17h16M8 20.5h8"/></svg>'
}

function iconFor(code) {
  if (code === 0) return ICONS.clear
  if (code === 1 || code === 2) return ICONS.cloud
  if (code === 3) return ICONS.cloud
  if (code === 45 || code === 48) return ICONS.fog
  if (code >= 51 && code <= 67) return ICONS.rain
  if (code >= 71 && code <= 77) return ICONS.snow
  if (code >= 80 && code <= 82) return ICONS.rain
  if (code === 85 || code === 86) return ICONS.snow
  if (code >= 95) return ICONS.thunder
  return ICONS.cloud
}

sill.onData(({ data, language }) => {
  const weather = data.weather ?? {}
  const zh = language !== 'en'
  const city = root.getElementById('city')
  const icon = root.getElementById('icon')
  const temp = root.getElementById('temp')
  const condition = root.getElementById('condition')
  const range = root.getElementById('range')

  if (city) city.textContent = weather.cityName ?? (weather.auto ? (zh ? '定位中…' : 'Locating…') : '')
  if (icon) icon.innerHTML = iconFor(Number(weather.code))
  if (temp) {
    temp.textContent = Number.isFinite(Number(weather.temp)) ? `${Math.round(weather.temp)}°` : '--°'
  }
  if (condition) {
    condition.textContent =
      weather.condition ??
      (weather.error ? (zh ? '天气暂不可用' : 'Weather unavailable') : zh ? '正在获取天气…' : 'Getting weather…')
  }
  if (range) {
    const high = Number(weather.high)
    const low = Number(weather.low)
    range.textContent =
      Number.isFinite(high) && Number.isFinite(low)
        ? zh
          ? `高 ${Math.round(high)}° · 低 ${Math.round(low)}°`
          : `H ${Math.round(high)}° · L ${Math.round(low)}°`
        : ''
  }
})
