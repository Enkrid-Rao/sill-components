// 时钟卡：HH:MM（可选 12 小时制）、秒、日期、时段，以及一天进度线。
// 时间由本地 Date 自己驱动（对齐到秒），不再依赖宿主每 1s 的数据推送：
// 即使系统监测卡顿，时钟也不会停。
const el = (id) => root.getElementById(id)
const pad = (value) => String(value).padStart(2, '0')

const PERIODS = [
  { until: 5, key: 'lateNight' },
  { until: 8, key: 'dawn' },
  { until: 12, key: 'morning' },
  { until: 18, key: 'afternoon' },
  { until: 24, key: 'evening' }
]

const settings = { seconds: true, hour12: false, date: true }
const ZH_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
let lastData = {}
let language = 'zh'
let timer = null

function dateLine(date) {
  if (language === 'en') {
    return `${EN_WEEKDAYS[date.getDay()]} ${date.getDate()} ${date.toLocaleDateString('en-GB', {
      month: 'short'
    })}`
  }
  return `${date.getMonth() + 1}月${date.getDate()}日 ${ZH_WEEKDAYS[date.getDay()]}`
}

function periodOf(hour) {
  return PERIODS.find((period) => hour < period.until)?.key ?? 'evening'
}

function periodLabel(period) {
  const node = el('daypart')?.querySelector(`[data-period="${period}"]`)
  return node?.textContent?.trim() ?? ''
}

function render(when = new Date()) {
  const digits = el('digits')
  const sec = el('sec')
  const seconds = el('seconds')
  const meridiem = el('meridiem')
  const date = el('date')
  const daypart = el('daypart')
  const fill = el('dayFill')
  const clock = el('clock')
  if (!digits) return

  const hour = when.getHours()
  const minute = when.getMinutes()
  const second = when.getSeconds()
  const displayHour = settings.hour12 ? hour % 12 || 12 : hour

  digits.textContent = `${pad(displayHour)}:${pad(minute)}`
  digits.setAttribute('datetime', when.toISOString())

  if (sec) sec.textContent = pad(second)
  if (seconds) seconds.hidden = !settings.seconds
  if (meridiem) {
    meridiem.hidden = !settings.hour12
    meridiem.textContent = hour < 12 ? 'AM' : 'PM'
  }

  if (date) {
    date.hidden = !settings.date
    date.textContent = dateLine(when)
  }

  const period = periodOf(hour)
  if (daypart) {
    daypart.dataset.period = period
    daypart.hidden = false
  }

  if (fill) {
    const progress = ((hour * 3600 + minute * 60 + second) / 86400) * 100
    fill.style.width = `${progress.toFixed(2)}%`
  }

  if (clock) {
    const timeText = `${pad(displayHour)}:${pad(minute)}${settings.seconds ? `:${pad(second)}` : ''}`
    const parts = [timeText]
    if (settings.hour12) parts.push(hour < 12 ? 'AM' : 'PM')
    parts.push(periodLabel(period))
    if (settings.date) {
      const spokenDate = lastData.time?.dateLabel
      if (spokenDate) parts.push(spokenDate)
    }
    clock.setAttribute('aria-label', parts.filter(Boolean).join(language === 'en' ? ', ' : '，'))
  }
}

function stopTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

/** 对齐到下一个整秒，避免 setInterval 漂移导致秒数抖动。 */
function schedule() {
  stopTimer()
  if (document.hidden) return
  const delay = 1000 - (Date.now() % 1000) + 16
  timer = setTimeout(() => {
    render(new Date())
    schedule()
  }, delay)
}

function start() {
  render(new Date())
  schedule()
}

document.addEventListener('visibilitychange', onVisibilityChange)

function onVisibilityChange() {
  if (document.hidden) {
    stopTimer()
  } else {
    render(new Date())
    schedule()
  }
}

sill.onData(({ data, language: nextLanguage }) => {
  lastData = data
  language = nextLanguage === 'en' ? 'en' : 'zh'
  render(new Date())
})

function applySettings(values) {
  if (!values || typeof values !== 'object') return
  if (typeof values.seconds === 'boolean') settings.seconds = values.seconds
  if (typeof values.hour12 === 'boolean') settings.hour12 = values.hour12
  if (typeof values.date === 'boolean') settings.date = values.date
  render(new Date())
}

sill.settings.get().then(applySettings)
const offSettings = sill.settings.onChange(applySettings)
sill.onDispose(() => {
  stopTimer()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (typeof offSettings === 'function') offSettings()
})

start()
