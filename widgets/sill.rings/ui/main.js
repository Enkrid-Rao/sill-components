function toggle(selector, value) {
  const valid = typeof value === 'number' && Number.isFinite(value)
  const unit = root.querySelector(selector)
  if (unit) unit.hidden = !valid
}

sill.onData(({ data }) => {
  toggle('#cpuPct', data.cpu?.usage)
  toggle('[data-metric="gpu"] .rings__unit', data.gpu?.usage)
  toggle('[data-metric="mem"] .rings__unit', data.mem?.percent)
  toggle('[data-metric="swap"] .rings__unit', data.swap?.percent)

  const meta = root.getElementById('swapMeta')
  if (meta) {
    const used = data.swap?.usedGb
    const total = data.swap?.totalGb
    meta.textContent =
      typeof used === 'number' && typeof total === 'number' && total > 0
        ? `${used.toFixed(1)} / ${total.toFixed(1)} GB`
        : ''
  }
})

// 卡片宽度决定一行四个还是两行两个；圆环尺寸跟着卡片走。
const host = root.host
const card = host.closest('.card')

function fit() {
  const width = Math.max(180, (card?.clientWidth ?? host.clientWidth) - 28)
  const oneRow = width >= 360
  const columns = oneRow ? 4 : 2
  const gap = 10
  const dial = Math.max(
    52,
    Math.min(oneRow ? (width - gap * 3) / 4 : (width - gap) / 2, 180)
  )
  host.style.setProperty('--gauge-size', `${Math.floor(dial)}px`)
  host.dataset.layout = oneRow ? 'row' : 'grid'

  const free = card?.dataset.free === 'true'
  host.style.height = free ? '100%' : ''
  host.style.display = free ? 'flex' : ''
  host.style.alignItems = free ? 'center' : ''
  host.style.justifyContent = free ? 'center' : ''
}

const observer = new ResizeObserver(fit)
observer.observe(card ?? host)
fit()
sill.onDispose(() => observer.disconnect())


