// 天气卡：城市、天气图标、温度、描述、高低温，外加「缓存 / 不可用 / 无数据」三种状态。
// 所有数字由这里格式化（保留整数并按设置换算 °F），文本节点由 i18n 静态节点 + JS 切换。
const el = (id) => root.getElementById(id)
const UNITS = { c: 'C', f: 'F' }

const settings = { unit: 'c' }
let unit = 'c'
let language = 'zh'
let lastWeather = null
let lastIconKey = ''

/* ---------- 图标 ---------- */

const CLOUD =
  'M10.2 25h11.6a4.2 4.2 0 0 0 0-8.4 6 6 0 0 0-11.4-1.2A4.1 4.1 0 0 0 10.2 25Z'

function rays(cx, cy, inner, outer, opacity = 1) {
  return Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4
    const x1 = (cx + Math.cos(angle) * inner).toFixed(2)
    const y1 = (cy + Math.sin(angle) * inner).toFixed(2)
    const x2 = (cx + Math.cos(angle) * outer).toFixed(2)
    const y2 = (cy + Math.sin(angle) * outer).toFixed(2)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" opacity="${opacity}"/>`
  }).join('')
}

function sun(cx = 16, cy = 16, radius = 5.1) {
  return `<circle class="wx__sun" cx="${cx}" cy="${cy}" r="${radius}"/>${rays(
    cx,
    cy,
    radius + 1.9,
    radius + 4
  ).replace(/<line /g, '<line class="wx__sun" ')}`
}

function moon(cx = 16, cy = 16, scale = 1) {
  return `<path class="wx__moon" transform="translate(${cx} ${cy}) scale(${scale}) translate(-16 -16)" d="M19.6 6.7a9.1 9.1 0 1 0 5.4 12.7 7.3 7.3 0 0 1-5.4-12.7Z"/>`
}

function cloud(shift = 0) {
  return `<path class="wx__cloud" transform="translate(0 ${shift})" d="${CLOUD}"/>`
}

function drops(count = 3, shift = 1.4) {
  const xs = count === 3 ? [11.2, 16, 20.8] : [12.4, 19.6]
  return xs
    .map(
      (x) =>
        `<line class="wx__drop" x1="${x}" y1="${26.9 + shift}" x2="${x - 0.9}" y2="${29.3 + shift}"/>`
    )
    .join('')
}

function flakes(shift = 1.2) {
  return [
    [11.2, 28.4],
    [16, 29.6],
    [20.8, 28.4]
  ]
    .map(([x, y]) => {
      const cy = y + shift
      const arms = [0, 60, 120]
        .map((angle) => {
          const rad = (angle * Math.PI) / 180
          const dx = Math.cos(rad) * 1.15
          const dy = Math.sin(rad) * 1.15
          const x1 = (x - dx).toFixed(2)
          const y1 = (cy - dy).toFixed(2)
          const x2 = (x + dx).toFixed(2)
          const y2 = (cy + dy).toFixed(2)
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
        })
        .join('')
      return `<g class="wx__flake">${arms}</g>`
    })
    .join('')
}

function bolt() {
  return `<path class="wx__bolt" d="M17.1 26.6l-3.2 4.7h2.7l-1 3 4.6-5.4h-2.7l1.2-2.3Z"/>`
}

function fog() {
  return `${cloud(-2.4)}<line class="wx__fog" x1="9.6" y1="27.6" x2="22.4" y2="27.6"/><line class="wx__fog" x1="12.4" y1="30.2" x2="19.6" y2="30.2"/>`
}

function svg(body) {
  return `<svg viewBox="0 0 32 32" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}

function iconFor(code, night) {
  if (code === 0) return svg(night ? moon() : sun())
  if (code === 1) return svg(night ? `${moon(21.6, 10.4, 0.62)}${cloud()}` : `${sun(21.6, 10.4, 3.4)}${cloud()}`)
  if (code === 2) return svg(night ? `${moon(21.6, 10.4, 0.62)}${cloud(0.8)}` : `${sun(21.6, 10.4, 3.4)}${cloud(0.8)}`)
  if (code === 3) return svg(cloud())
  if (code === 45 || code === 48) return svg(fog())
  if (code >= 51 && code <= 57) return svg(`${cloud(-1.2)}${drops(2, 0.4)}`)
  if (code >= 61 && code <= 67) return svg(`${cloud(-1.2)}${drops(3, 0.4)}`)
  if (code >= 71 && code <= 77) return svg(`${cloud(-1.2)}${flakes(0.2)}`)
  if (code >= 80 && code <= 82) return svg(`${cloud(-1.2)}${drops(3, 0.4)}`)
  if (code === 85 || code === 86) return svg(`${cloud(-1.2)}${flakes(0.2)}`)
  if (code >= 95) return svg(`${cloud(-1.4)}${bolt()}`)
  return svg(cloud())
}

function nightNow() {
  const hour = new Date().getHours()
  return hour < 6 || hour >= 18
}

/* ---------- 格式化 ---------- */

function convert(celsius) {
  return unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
}

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(convert(value)) : null
}

function timeLabel(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return ''
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(ms))
}

function setRange(high, low) {
  const range = el('range')
  if (!range) return
  if (high === null && low === null) {
    range.replaceChildren()
    return
  }
  const build = (kind, value) => {
    if (value === null) return null
    const span = document.createElement('span')
    span.className = kind === 'high' ? 'wx__hi' : 'wx__lo'
    const arrow = document.createElement('span')
    arrow.className = 'wx__arrow'
    arrow.textContent = kind === 'high' ? '↑' : '↓'
    span.append(arrow, document.createTextNode(`${value}°`))
    return span
  }
  const parts = [build('high', high), build('low', low)].filter(Boolean)
  range.replaceChildren(...parts)
}

/* ---------- 渲染 ---------- */

function render() {
  const wx = el('wx')
  const weather = lastWeather
  const temp = number(weather?.temp)
  const high = number(weather?.high)
  const low = number(weather?.low)
  const hasTemp = temp !== null
  const failed = Boolean(weather?.error)
  const stale = (failed || Boolean(weather?.stale)) && hasTemp
  const state = hasTemp ? (stale ? 'stale' : 'ready') : failed ? 'error' : 'loading'

  if (wx) wx.dataset.state = state

  const city = typeof weather?.cityName === 'string' ? weather.cityName.trim() : ''
  const locating = !city && Boolean(weather?.auto) && state === 'loading'
  const cityEl = el('city')
  if (cityEl) {
    cityEl.textContent = city
    cityEl.hidden = !city
  }
  const pending = el('cityPending')
  if (pending) pending.hidden = !locating
  const place = el('place')
  if (place) place.hidden = !city && !locating

  const tempEl = el('temp')
  if (tempEl) tempEl.textContent = hasTemp ? String(temp) : '--'
  const unitEl = el('unit')
  if (unitEl) {
    unitEl.textContent = UNITS[unit] ?? 'C'
    unitEl.hidden = !hasTemp
  }
  const degEl = wx?.querySelector('.wx__deg')
  if (degEl) degEl.hidden = !hasTemp

  const condLive = el('condLive')
  const condLoading = el('condLoading')
  const condError = el('condError')
  const condition = typeof weather?.condition === 'string' ? weather.condition.trim() : ''
  if (condLive) {
    condLive.textContent = condition
    condLive.hidden = !condition
  }
  if (condLoading) condLoading.hidden = !(state === 'loading' && !condition)
  if (condError) condError.hidden = !(state === 'error' && !condition)

  const icon = el('icon')
  if (icon) {
    const code = typeof weather?.code === 'number' ? weather.code : -1
    const drawable = state === 'ready' || state === 'stale'
    const key = drawable ? `${code}:${nightNow()}` : 'neutral'
    if (key !== lastIconKey) {
      lastIconKey = key
      icon.innerHTML = drawable ? iconFor(code, nightNow()) : svg(cloud())
    }
  }

  setRange(high, low)

  const updated = el('updated')
  const badge = el('stale')
  const side = wx?.querySelector('.wx__side')
  const updatedAt = weather?.updatedAt
  if (badge) badge.hidden = !stale
  if (updated) updated.textContent = stale ? timeLabel(updatedAt) : ''
  if (side) side.hidden = high === null && low === null && !stale
  if (cityEl) cityEl.title = city

  if (wx) {
    const unitLetter = UNITS[unit] ?? 'C'
    const pieces = []
    if (city) pieces.push(city)
    if (condition) pieces.push(condition)
    else if (state === 'loading') pieces.push(el('condLoading')?.textContent ?? '')
    else if (state === 'error') pieces.push(el('condError')?.textContent ?? '')
    pieces.push(hasTemp ? `${temp}°${unitLetter}` : '—')
    if (high !== null) pieces.push(`↑ ${high}°`)
    if (low !== null) pieces.push(`↓ ${low}°`)
    if (stale) {
      const when = timeLabel(updatedAt)
      if (when) pieces.push(`${el('stale')?.textContent?.trim() ?? ''} ${when}`.trim())
    }
    wx.setAttribute('aria-label', pieces.filter(Boolean).join(language === 'en' ? ', ' : '，'))
  }
}

sill.onData(({ data, language: nextLanguage }) => {
  lastWeather = data.weather ?? null
  language = nextLanguage === 'en' ? 'en' : 'zh'
  render()
})

function applySettings(values) {
  if (!values || typeof values !== 'object') return
  if (values.unit === 'c' || values.unit === 'f') unit = values.unit
  render()
}

sill.settings.get().then(applySettings)
const offSettings = sill.settings.onChange(applySettings)
sill.onDispose(() => {
  if (typeof offSettings === 'function') offSettings()
})


