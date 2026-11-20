// 月历：周一开始（中文）/ 周日开始（英文），今天高亮。
const WEEKDAYS = {
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
}

let lastKey = ''

sill.onData(({ data, language }) => {
  const iso = data.time?.iso
  if (!iso) return
  const now = new Date(iso)
  const locale = language === 'en' ? 'en' : 'zh'
  const startMonday = locale === 'zh'
  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${locale}`
  if (key === lastKey) return
  lastKey = key

  const month = root.getElementById('month')
  const year = root.getElementById('year')
  const week = root.getElementById('weekdays')
  const grid = root.getElementById('grid')
  if (!month || !year || !week || !grid) return

  const monthName = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    month: 'long'
  }).format(now)
  month.textContent = monthName
  year.textContent = String(now.getFullYear())

  week.replaceChildren(
    ...WEEKDAYS[locale].map((label) => {
      const cell = document.createElement('span')
      cell.textContent = label
      return cell
    })
  )

  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const offset = (first.getDay() - (startMonday ? 1 : 0) + 7) % 7
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < offset; index += 1) {
    const blank = document.createElement('span')
    blank.className = 'cal__day'
    cells.push(blank)
  }

  for (let day = 1; day <= days; day += 1) {
    const cell = document.createElement('span')
    cell.className = 'cal__day'
    cell.textContent = String(day)
    const date = new Date(now.getFullYear(), now.getMonth(), day)
    cell.dataset.weekend = date.getDay() === 0 || date.getDay() === 6 ? 'true' : 'false'
    cell.dataset.today = day === now.getDate() ? 'true' : 'false'
    cells.push(cell)
  }

  grid.replaceChildren(...cells)
})
