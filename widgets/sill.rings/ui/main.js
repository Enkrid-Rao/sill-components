// 四圆环：CPU / GPU / RAM / SWAP。弧长由 data-sill-meter 写 --sill-value，
// 中间的整数、单位、副标题和 aria-label 在这里格式化。
const el = (id) => root.getElementById(id)

const GAUGES = [
  { key: 'cpu', gauge: 'gaugeCpu', num: 'numCpu', pct: 'pctCpu', sub: 'subCpu' },
  { key: 'gpu', gauge: 'gaugeGpu', num: 'numGpu', pct: 'pctGpu', sub: 'subGpu' },
  { key: 'ram', gauge: 'gaugeRam', num: 'numRam', pct: 'pctRam', sub: 'subRam' },
  { key: 'swap', gauge: 'gaugeSwap', num: 'numSwap', pct: 'pctSwap', sub: 'subSwap' }
]

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function percentOf(data, key) {
  if (key === 'cpu') return data.cpu?.usage
  if (key === 'gpu') return data.gpu?.usage
  if (key === 'ram') return data.mem?.percent
  return data.swap?.percent
}

function gbText(usedMb, totalMb) {
  if (!finite(usedMb) || !finite(totalMb) || totalMb <= 0) return ''
  return `${(usedMb / 1024).toFixed(1)} / ${(totalMb / 1024).toFixed(1)} GB`
}

function subText(data, key) {
  if (key === 'cpu') {
    const speed = data.cpu?.speedGhz
    return finite(speed) ? `~${speed.toFixed(1)} GHz` : ''
  }
  if (key === 'gpu') return gbText(data.gpu?.memMb, data.gpu?.totalMb)
  if (key === 'ram') {
    const used = data.mem?.usedGb
    const total = data.mem?.totalGb
    return finite(used) && finite(total) && total > 0 ? `${used.toFixed(1)} / ${total.toFixed(1)} GB` : ''
  }
  const used = data.swap?.usedGb
  const total = data.swap?.totalGb
  return finite(used) && finite(total) && total > 0 ? `${used.toFixed(1)} / ${total.toFixed(1)} GB` : ''
}

function render(data) {
  const noData = el('noDataLabel')?.textContent?.trim() ?? '—'

  for (const entry of GAUGES) {
    const gauge = el(entry.gauge)
    const num = el(entry.num)
    const pct = el(entry.pct)
    const sub = el(entry.sub)
    if (!gauge || !num) continue

    const value = percentOf(data, entry.key)
    const valid = finite(value)
    const rounded = valid ? Math.round(Math.max(0, Math.min(100, value))) : null
    const detail = subText(data, entry.key)

    num.textContent = rounded === null ? '—' : String(rounded)
    if (pct) pct.hidden = rounded === null
    if (sub) sub.textContent = detail || (rounded === null ? '—' : '')
    gauge.dataset.empty = rounded === null ? 'true' : 'false'

    const arc = gauge.querySelector('.gauge__arc')
    if (arc) arc.style.opacity = valid && value > 0 ? '1' : '0'

    const label = gauge.querySelector('.gauge__label')?.textContent?.trim() ?? ''
    const parts = [label, rounded === null ? noData : `${rounded}%`]
    if (detail) parts.push(detail)
    gauge.setAttribute('aria-label', parts.filter(Boolean).join(' · '))
  }
}

sill.onData(({ data }) => {
  render(data)
})

