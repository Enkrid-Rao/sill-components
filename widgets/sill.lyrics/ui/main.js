// 官方歌词组件：LRCLIB（免费、CORS 开放）同步歌词 + 本地平滑推进。
// 数据来自 manifest 绑定的 media.nowPlaying；偏移量来自组件设置。
const API = 'https://lrclib.net/api/search'
const TICK_MS = 200

const el = (id) => root.getElementById(id)

const TEXT = {
  en: {
    synced: 'SYNCED',
    plain: 'NO TIMING',
    loading: 'SEARCHING',
    empty: 'NO LYRICS',
    idle: 'IDLE',
    instrumental: 'INSTRUMENTAL'
  },
  zh: {
    synced: '同步',
    plain: '无时间轴',
    loading: '搜索中',
    empty: '没有歌词',
    idle: '等待播放',
    instrumental: '纯音乐'
  }
}

let language = 'zh'
let lines = []
let plainLines = []
let status = 'idle'
let offset = 0
let basePosition = 0
let baseAt = 0
let playing = false
let lastTrack = ''
let lastText = ''
let requestSeq = 0

function text(key) {
  return (TEXT[language] ?? TEXT.en)[key] ?? ''
}

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
  return parsed.sort((a, b) => a.time - b.time)
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

const SHOW_STATE = new Set(['synced', 'plain', 'loading'])

function setState(next) {
  status = next
  const state = el('state')
  if (state) state.textContent = SHOW_STATE.has(next) ? text(next) : ''
}

function setCurrent(value, animate, quiet = false) {
  const line = el('line')
  if (!line) return
  const nextText = value || '—'
  if (nextText === lastText) return
  lastText = nextText
  line.textContent = nextText
  line.classList.toggle('lyr__line--quiet', quiet || !value)
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

function setSong(media) {
  const song = el('song')
  if (!song) return
  song.textContent = media?.title ? `${media.artist ?? ''} — ${media.title}`.replace(/^ — /, '') : ''
}

function clearLines() {
  lines = []
  plainLines = []
  lastText = ''
  setCurrent('', false)
  setNext('')
}

function trackKey(media) {
  return media?.title ? `${media.artist ?? ''}\u0000${media.title}` : ''
}

async function loadLyrics(media) {
  const seq = ++requestSeq
  clearLines()
  setState('loading')
  setCurrent('…', false, true)

  const params = new URLSearchParams()
  params.set('track_name', media.title)
  if (media.artist) params.set('artist_name', media.artist)
  if (media.album) params.set('album_name', media.album)
  if (media.duration > 0) params.set('duration', String(Math.round(media.duration)))

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const response = await fetch(`${API}?${params.toString()}`, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const list = await response.json()
    if (seq !== requestSeq) return

    const candidates = Array.isArray(list) ? list : []
    // 同名歌很多：优先同步歌词，再按时长差最小的选
    const distance = (item) =>
      Math.abs(Number(item?.duration ?? 0) - Number(media.duration ?? 0))
    const best =
      candidates
        .filter((item) => item?.syncedLyrics)
        .sort((a, b) => distance(a) - distance(b))[0] ??
      candidates
        .filter((item) => item?.plainLyrics)
        .sort((a, b) => distance(a) - distance(b))[0]

    if (!best) {
      setState('empty')
      setCurrent(text('empty'), false, true)
      return
    }
    if (best.instrumental && !best.syncedLyrics) {
      setState('instrumental')
      setCurrent(text('instrumental'), false, true)
      return
    }
    if (best.syncedLyrics) {
      lines = parseLrc(best.syncedLyrics)
      if (lines.length) {
        setState('synced')
        return
      }
    }
    if (best.plainLyrics) {
      plainLines = String(best.plainLyrics)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 2)
      setState('plain')
      setCurrent(plainLines[0] ?? text('empty'), false)
      setNext(plainLines[1] ?? '')
      return
    }
    setState('empty')
    setCurrent(text('empty'), false, true)
  } catch {
    if (seq === requestSeq) {
      setState('empty')
      setCurrent(text('empty'), false, true)
    }
  } finally {
    clearTimeout(timer)
  }
}

function draw() {
  if (status !== 'synced' || !lines.length) return
  const at = basePosition + (playing ? (performance.now() - baseAt) / 1000 : 0) + offset
  const index = indexAt(at)
  const current = index >= 0 ? lines[index] : lines[0]
  if (!current) return
  setCurrent(current.text, true)
  setNext(lines[index + 1]?.text ?? '')
}

sill.onData(({ data, language: nextLanguage }) => {
  const resolved = nextLanguage === 'en' ? 'en' : 'zh'
  if (resolved !== language) {
    language = resolved
    // 语言切换：静态状态文案跟着变，同步歌词本身不用重载
    if (status === 'idle' || status === 'empty' || status === 'instrumental') {
      setCurrent(text(status), false, true)
    }
    setState(status)
  }
  const media = data.media ?? {}
  const active = Boolean(media.active && media.title)

  basePosition = Number(media.position ?? 0)
  baseAt = performance.now()
  playing = media.status === 'Playing'

  if (!active) {
    ++requestSeq
    clearLines()
    setState('idle')
    setCurrent(text('idle'), false, true)
    setSong(null)
    lastTrack = ''
    return
  }

  setSong(media)
  const key = trackKey(media)
  if (key !== lastTrack) {
    lastTrack = key
    void loadLyrics(media)
  }
  draw()
})

sill.settings.get().then((values) => {
  const value = Number(values?.offset)
  if (Number.isFinite(value)) offset = Math.max(-10, Math.min(10, value))
})

sill.settings.onChange((values) => {
  const value = Number(values?.offset)
  if (Number.isFinite(value)) offset = Math.max(-10, Math.min(10, value))
})

setInterval(draw, TICK_MS)

