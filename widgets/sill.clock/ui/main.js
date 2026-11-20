// 时钟卡：HH:MM（可选 12 小时制）、秒、日期、时段，以及一天进度线。
// 文本全部由这里写：宿主只推送 time.now，避免 data-sill-text 每秒覆盖。
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
let lastIso = ''
let lastData = {}
let language = 'zh'

/* 日期自己排：宿主的 dateLabel 是「11月20日星期五 / Friday 20 November」，
   在卡片里太长，这里压成「11月20日 周五 / Fri 20 Nov」。 */
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

function render() {
  const digits = el('digits')
  const sec = el('sec')
  const seconds = el('seconds')
  const meridiem = el('meridiem')
  const date = el('date')
  const daypart = el('daypart')
  const fill = el('dayFill')
  const clock = el('clock')
  if (!digits) return

  const when = lastIso ? new Date(lastIso) : null
  const valid = when instanceof Date && Number.isFinite(when.getTime())
  const hour = valid ? when.getHours() : 0
  const minute = valid ? when.getMinutes() : 0
  const second = valid ? when.getSeconds() : 0
  const displayHour = settings.hour12 && valid ? hour % 12 || 12 : hour
  const dateLabel = valid ? dateLine(when) : ''

  digits.textContent = valid ? `${pad(displayHour)}:${pad(minute)}` : '--:--'
  if (lastIso) digits.setAttribute('datetime', lastIso)

  if (sec) sec.textContent = valid ? pad(second) : '00'
  if (seconds) seconds.hidden = !settings.seconds
  if (meridiem) {
    meridiem.hidden = !settings.hour12
    meridiem.textContent = valid ? (hour < 12 ? 'AM' : 'PM') : ''
  }

  if (date) {
    date.hidden = !settings.date
    date.textContent = dateLabel
  }

  const period = valid ? periodOf(hour) : 'evening'
  if (daypart) {
    daypart.dataset.period = period
    daypart.hidden = !valid
  }

  if (fill) {
    const progress = valid ? ((hour * 3600 + minute * 60 + second) / 86400) * 100 : 0
    fill.style.width = `${progress.toFixed(2)}%`
  }

  if (clock) {
    const parts = []
    if (valid) {
      const timeText = `${pad(displayHour)}:${pad(minute)}${settings.seconds ? `:${pad(second)}` : ''}`
      parts.push(timeText)
      if (settings.hour12) parts.push(hour < 12 ? 'AM' : 'PM')
      parts.push(periodLabel(period))
      if (settings.date) {
        const spokenDate = lastData.time?.dateLabel
        if (spokenDate) parts.push(spokenDate)
      }
    }
    clock.setAttribute('aria-label', parts.filter(Boolean).join(language === 'en' ? ', ' : '，') || '—')
  }
}

sill.onData(({ data, language: nextLanguage }) => {
  lastData = data
  lastIso = data.time?.iso ?? ''
  language = nextLanguage === 'en' ? 'en' : 'zh'
  render()
})

function applySettings(values) {
  if (!values || typeof values !== 'object') return
  if (typeof values.seconds === 'boolean') settings.seconds = values.seconds
  if (typeof values.hour12 === 'boolean') settings.hour12 = values.hour12
  if (typeof values.date === 'boolean') settings.date = values.date
  render()
}

sill.settings.get().then(applySettings)
const offSettings = sill.settings.onChange(applySettings)
sill.onDispose(() => {
  if (typeof offSettings === 'function') offSettings()
})

