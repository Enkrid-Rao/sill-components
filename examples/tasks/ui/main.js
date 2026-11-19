// host.state 一次拿到时间、快照、媒体、天气和待办，不用为每个字段加 provider。
const card = root.querySelector('.tasks')
const fill = root.querySelector('#fill')
const count = root.querySelector('#count')
const mode = root.querySelector('#mode')

let compact = false
let language = 'zh'

function applyMode() {
  card.classList.toggle('is-compact', compact)
  mode.textContent = compact
    ? language === 'zh'
      ? '展开'
      : 'expand'
    : language === 'zh'
      ? '紧凑'
      : 'compact'
}

sill.onData(({ data, language: lang }) => {
  language = lang
  const todos = Array.isArray(data.state?.todos) ? data.state.todos : []
  const done = todos.reduce((sum, item) => sum + (item && item.done ? 1 : 0), 0)

  count.textContent = `${done} / ${todos.length}`
  fill.style.width = `${todos.length ? (done / todos.length) * 100 : 0}%`

  // repeat 行由宿主复用；按索引同步完成态，CSS 自己画删除线和勾。
  const rows = root.querySelectorAll('[data-sill-list] > .task')
  rows.forEach((row, index) => {
    if (todos[index]?.done) row.setAttribute('data-done', '')
    else row.removeAttribute('data-done')
  })

  applyMode()
})

// 组件私有设置：落在 <userData>/widget-data/sill.showcase.tasks.json。
sill.storage.get().then((saved) => {
  compact = saved.compact === true
  applyMode()
})

mode.addEventListener('click', async () => {
  compact = !compact
  applyMode()
  await sill.storage.patch({ compact })
})
