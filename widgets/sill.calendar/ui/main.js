// 月历：固定六周（42 格）+ 上 / 下月切换；中文周一开头，英文周日开头。
// 时间只用来确定「今天」；切月是本地视图状态，不写存储。
const el = (id) => root.getElementById(id)

const WEEKDAYS = {
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
}
const ZH_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = new Intl.DateTimeFormat('en-US', { month: 'long' })

let language = 'zh'
let today = null
let viewYear = 0
let viewMonth = 0
let following = true
let initialized = false
let lastWeekKey = ''
let swapToken = 0

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function monthLabel(year, month) {
  if (language === 'en') return MONTH_NAMES.format(new Date(year, month, 1))
  return `${month + 1}月`
}

function todayLabel(date) {
  if (!date) return ''
  if (language === 'en') {
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date)
    return `${EN_WEEKDAYS[date.getDay()]} ${date.getDate()} ${month}`
  }
  return `${date.getMonth() + 1}月${date.getDate()}日 ${ZH_WEEKDAYS[date.getDay()]}`
}

function renderWeekdays() {
  const week = el('weekdays')
  if (!week || lastWeekKey === language) return
  lastWeekKey = language
  week.replaceChildren(
    ...WEEKDAYS[language].map((label) => {
      const cell = document.createElement('span')
      cell.textContent = label
      return cell
    })
  )
}

function renderGrid(animate) {
  const grid = el('grid')
  const month = el('month')
  const year = el('year')
  const todayLabelEl = el('todayLabel')
  const todayBtn = el('today')
  const cal = el('cal')
  if (!grid || !month || !year) return

  const label = monthLabel(viewYear, viewMonth)
  month.textContent = label
  year.textContent = String(viewYear)
  if (todayLabelEl) todayLabelEl.textContent = todayLabel(today)
  if (todayBtn) todayBtn.hidden = following
  if (cal) {
    cal.dataset.away = following ? 'false' : 'true'
    const spoken = today ? ` · ${todayLabel(today)}` : ''
    const spokenLabel =
      language === 'en' ? `${label} ${viewYear}${spoken}` : `${viewYear}年${label}${spoken}`
    cal.setAttribute('aria-label', spokenLabel)
  }

  const mondayFirst = language !== 'en'
  const first = new Date(viewYear, viewMonth, 1)
  const offset = (first.getDay() - (mondayFirst ? 1 : 0) + 7) % 7
  const start = new Date(viewYear, viewMonth, 1 - offset)
  const cells = []

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    const cell = document.createElement('span')
    cell.className = 'cal__day'
    cell.dataset.weekend = date.getDay() === 0 || date.getDay() === 6 ? 'true' : 'false'
    cell.dataset.out = date.getMonth() !== viewMonth ? 'true' : 'false'
    if (today && sameDay(date, today)) cell.dataset.today = 'true'

    const num = document.createElement('span')
    num.className = 'cal__num'
    num.textContent = String(date.getDate())
    cell.append(num)
    cells.push(cell)
  }

  const apply = () => grid.replaceChildren(...cells)

  if (animate) {
    const token = ++swapToken
    grid.classList.add('is-swapping')
    window.setTimeout(() => {
      if (token !== swapToken) return
      apply()
      requestAnimationFrame(() => grid.classList.remove('is-swapping'))
    }, 120)
  } else {
    swapToken += 1
    grid.classList.remove('is-swapping')
    apply()
  }
}

function setView(year, month) {
  if (!initialized) return
  viewYear = year
  viewMonth = month
  renderGrid(true)
}

function stepMonth(delta) {
  if (!initialized) return
  following = false
  const next = new Date(viewYear, viewMonth + delta, 1)
  setView(next.getFullYear(), next.getMonth())
}

sill.onData(({ data, language: nextLanguage }) => {
  const next = nextLanguage === 'en' ? 'en' : 'zh'
  const langChanged = next !== language
  language = next
  renderWeekdays()

  const iso = data.time?.iso
  const parsed = iso ? new Date(iso) : null
  if (!(parsed instanceof Date) || !Number.isFinite(parsed.getTime())) return

  const dateChanged = !today || !sameDay(today, parsed)
  today = parsed

  if (!initialized) {
    initialized = true
    viewYear = parsed.getFullYear()
    viewMonth = parsed.getMonth()
    renderGrid(false)
    return
  }

  if (following) {
    const rolled =
      parsed.getFullYear() !== viewYear || parsed.getMonth() !== viewMonth
    if (rolled) {
      viewYear = parsed.getFullYear()
      viewMonth = parsed.getMonth()
      renderGrid(true)
      return
    }
  }

  if (langChanged || dateChanged) renderGrid(false)
})

el('prev')?.addEventListener('click', () => stepMonth(-1))
el('next')?.addEventListener('click', () => stepMonth(1))
el('today')?.addEventListener('click', () => {
  if (!initialized) return
  following = true
  setView(today.getFullYear(), today.getMonth())
})
