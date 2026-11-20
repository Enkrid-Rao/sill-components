// 官方歌词组件：LRCLIB（免费、CORS 开放）同步歌词 + 本地平滑推进。
// 状态、文案都走 widget.json 的 strings；这里只管请求、解析和推进。
const API = 'https://lrclib.net/api/search'
const TICK_MS = 100
const CACHE_MS = 10 * 60 * 1000
const TIMEOUT_MS = 9000

const el = (id) => root.getElementById(id)

let status = 'idle'
let lines = []
let media = null
let offset = 0
let basePosition = 0
let baseAt = 0
let playing = false
let currentTrack = ''
let lastText = ''
let requestSeq = 0
let controller = null
let ticker = null
let lastBar = -1
let currentIndex = -1

const cache = new Map()
const BLOCKS = {
  synced: 'stage',
  loading: 'loading',
  plain: 'plain',
  idle: 'idle',
  empty: 'empty',
  error: 'error',
  instrumental: 'instrumental'
}
const BADGED = new Set(['synced', 'plain', 'loading'])

/* ---------- 歌词解析 ---------- */

function parseLrc(source) {
  const parsed = []
  for (const raw of String(source ?? '').split('\n')) {
    const times = [...raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)]
    if (!times.length) continue
    const content = raw.replace(/\[[^\]]*\]/g, '').trim()
    if (!content) continue
    for (const match of times) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0
      parsed.push({ time: minutes * 60 + seconds + fraction, text: content })
    }
  }
  parsed.sort((a, b) => a.time - b.time)

  const deduped = []
  for (const line of parsed) {
    const prev = deduped[deduped.length - 1]
    if (prev && prev.text === line.text && line.time - prev.time < 0.35) continue
    deduped.push(line)
  }
  return deduped
}

function indexAt(at) {
  let low = 0
  let high = lines.length - 1
  let found = -1
  while (low <= high) {
    const middle = (low + high) >> 1
    if (lines[middle].time <= at) {
      found = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return found
}

function trackKey(item) {
  return item?.title ? `${item.artist ?? ''}\u0000${item.title}` : ''
}

function pickBest(candidates, duration) {
  const distance = (item) => Math.abs(Number(item?.duration ?? 0) - Number(duration ?? 0))
  const synced = candidates.filter((item) => item?.syncedLyrics)
  const near = synced.find((item) => Number(item.duration) > 0 && distance(item) <= 6)
  if (near) return near
  if (synced.length) return [...synced].sort((a, b) => distance(a) - distance(b))[0]

  const plain = candidates.filter((item) => item?.plainLyrics)
  if (plain.length) {
    const nearPlain = plain.find((item) => Number(item.duration) > 0 && distance(item) <= 6)
    return nearPlain ?? [...plain].sort((a, b) => distance(a) - distance(b))[0]
  }

  // 纯音乐条目通常没有歌词文本，只有 instrumental 标记
  const instrumental = candidates.find((item) => item?.instrumental)
  return instrumental ?? null
}

/* ---------- 渲染 ---------- */

function setLine(value, animate) {
  const line = el('line')
  if (!line) return
  const nextText = value || '—'
  if (nextText === lastText) return
  lastText = nextText
  line.textContent = nextText
  if (animate && value) {
    line.classList.remove('is-in')
    void line.offsetWidth
    line.classList.add('is-in')
  }
}

function setNext(value) {
  const next = el('next')
  if (next) next.textContent = value || ''
}

function setBar(value) {
  const bar = el('bar')
  if (!bar) return
  const rounded = Math.round(Math.max(0, Math.min(100, value)) * 10) / 10
  if (rounded === lastBar) return
  lastBar = rounded
  bar.style.width = `${rounded}%`
  el('progress')?.setAttribute('aria-valuenow', String(rounded))
}

function setStatus(next) {
  status = next
  const lyr = el('lyr')
  if (lyr) lyr.dataset.state = next

  const badge = el('badge')
  if (badge) {
    badge.dataset.state = next
    badge.hidden = !BADGED.has(next)
  }

  for (const id of new Set(Object.values(BLOCKS))) {
    const node = el(id)
    if (node) node.hidden = true
  }
  const active = el(BLOCKS[next])
  if (active) active.hidden = false

  updateOffsetChip()
  syncTicker()
}

function setSong(item) {
  const song = el('song')
  if (!song) return
  if (!item?.title) {
    song.textContent = ''
    song.removeAttribute('title')
    return
  }
  const label = item.artist ? `${item.artist} — ${item.title}` : item.title
  song.textContent = label
  song.title = label
}

function renderPlain(text) {
  const box = el('plain')
  if (!box) return
  const rows = String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
  box.replaceChildren(
    ...rows.map((row) => {
      const p = document.createElement('p')
      p.textContent = row
      return p
    })
  )
}

function draw() {
  if (status !== 'synced' || !lines.length) return
  const at = basePosition + (playing ? (performance.now() - baseAt) / 1000 : 0) + offset
  let index = indexAt(at)

  // 数据回推 / 播放位置在句界附近抖动时，别让当前句来回闪；
  // 真正的回退（> 250ms）仍然允许立即跟随。
  if (currentIndex >= 0 && index < currentIndex && at > lines[currentIndex].time - 0.25) {
    index = currentIndex
  }
  currentIndex = index

  if (index < 0) {
    setLine('', false)
    setNext(lines[0]?.text ?? '')
    setBar(0)
    return
  }

  const current = lines[index]
  const next = lines[index + 1]
  setLine(current.text, true)
  setNext(next?.text ?? '')

  if (!next) {
    setBar(100)
    return
  }
  const span = Math.max(0.4, next.time - current.time)
  setBar(((at - current.time) / span) * 100)
}

/* ---------- 计时器 ---------- */

function syncTicker() {
  const shouldTick = status === 'synced' && playing
  if (shouldTick && !ticker) {
    ticker = setInterval(draw, TICK_MS)
    return
  }
  if (!shouldTick && ticker) {
    clearInterval(ticker)
    ticker = null
  }
}

/* ---------- 数据加载 ---------- */

function abortRequest() {
  if (controller) {
    controller.abort()
    controller = null
  }
}

function applyResult(result) {
  if (result.kind === 'synced') {
    lines = result.lines
    currentIndex = -1
    setStatus('synced')
    draw()
    return
  }

  lines = []
  currentIndex = -1
  if (result.kind === 'plain') {
    renderPlain(result.plain)
    setStatus('plain')
    return
  }
  setStatus(result.kind)
}

function cachedResult(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_MS) {
    cache.delete(key)
    return null
  }
  return hit.result
}

async function loadLyrics(item) {
  const seq = ++requestSeq
  abortRequest()

  const key = trackKey(item)
  const cached = cachedResult(key)
  if (cached) {
    applyResult(cached)
    return
  }

  lines = []
  currentIndex = -1
  setStatus('loading')
  setBar(0)
  setLine('', false)
  setNext('')

  const params = new URLSearchParams()
  params.set('track_name', item.title)
  if (item.artist) params.set('artist_name', item.artist)
  if (item.album) params.set('album_name', item.album)
  if (Number(item.duration) > 0) params.set('duration', String(Math.round(item.duration)))

  const local = new AbortController()
  controller = local
  const timer = setTimeout(() => local.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${API}?${params.toString()}`, { signal: local.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const list = await response.json()
    if (seq !== requestSeq) return

    const best = pickBest(Array.isArray(list) ? list : [], item.duration)
    if (!best) {
      cache.set(key, { at: Date.now(), result: { kind: 'empty' } })
      setStatus('empty')
      return
    }
    if (best.instrumental && !best.syncedLyrics) {
      cache.set(key, { at: Date.now(), result: { kind: 'instrumental' } })
      setStatus('instrumental')
      return
    }
    if (best.syncedLyrics) {
      const parsed = parseLrc(best.syncedLyrics)
      if (parsed.length) {
        cache.set(key, { at: Date.now(), result: { kind: 'synced', lines: parsed } })
        applyResult({ kind: 'synced', lines: parsed })
        return
      }
    }
    if (best.plainLyrics) {
      const result = { kind: 'plain', plain: best.plainLyrics }
      cache.set(key, { at: Date.now(), result })
      applyResult(result)
      return
    }
    cache.set(key, { at: Date.now(), result: { kind: 'empty' } })
    setStatus('empty')
  } catch {
    if (seq !== requestSeq) return
    setStatus('error')
  } finally {
    clearTimeout(timer)
    if (seq === requestSeq) controller = null
  }
}

function retry() {
  if (!media?.title) return
  cache.delete(trackKey(media))
  void loadLyrics(media)
}

/* ---------- 设置 ---------- */

function updateOffsetChip() {
  const chip = el('offset')
  if (!chip) return
  const relevant = status === 'synced' || status === 'plain' || status === 'loading'
  if (!relevant || !Number.isFinite(offset) || Math.abs(offset) < 0.01) {
    chip.hidden = true
    return
  }
  chip.hidden = false
  const rounded = Math.round(offset * 10) / 10
  chip.textContent = `${rounded > 0 ? '+' : ''}${rounded}s`
}

function applySettings(values) {
  const value = Number(values?.offset)
  if (!Number.isFinite(value)) return
  offset = Math.max(-10, Math.min(10, value))
  updateOffsetChip()
  if (status === 'synced') draw()
}

/* ---------- 事件 ---------- */

sill.onData(({ data }) => {
  media = data.media ?? {}
  const sampledAt = Number(media.sampledAt ?? 0)
  const lag =
    media.status === 'Playing' && sampledAt > 0
      ? Math.min(5, Math.max(0, (Date.now() - sampledAt) / 1000))
      : 0
  // SMTC 的 position 是采样时刻的值；把采样到渲染之间的时间补上，
  // 否则歌词会比声音慢半拍到一拍。上限 5s，避免长时间暂停后跳句。
  basePosition = Number(media.position ?? 0) + lag
  baseAt = performance.now()
  playing = media.status === 'Playing'

  const active = Boolean(media.active && media.title)
  if (!active) {
    ++requestSeq
    abortRequest()
    lines = []
    currentIndex = -1
    currentTrack = ''
    lastText = ''
    setSong(null)
    setStatus('idle')
    return
  }

  setSong(media)
  const key = trackKey(media)
  if (key !== currentTrack) {
    currentTrack = key
    void loadLyrics(media)
    return
  }

  syncTicker()
  draw()
})

el('retryEmpty')?.addEventListener('click', retry)
el('retryError')?.addEventListener('click', retry)

sill.settings.get().then(applySettings)
const offSettings = sill.settings.onChange(applySettings)

sill.onDispose(() => {
  if (typeof offSettings === 'function') offSettings()
  abortRequest()
  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }
})
