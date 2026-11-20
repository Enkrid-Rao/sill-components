// 内联 JS：宿主注入 sill 与 root，脚本只执行一次。
const svg = root.querySelector('#analog-svg')
const ticks = root.querySelector('#ticks')
const hourHand = root.querySelector('#hour')
const minHand = root.querySelector('#min')
const secHand = root.querySelector('#sec')
const tz = root.querySelector('#tz')
const ns = svg.namespaceURI

// 刻度只建一次。数据刷新走 onData，不会重新执行脚本。
for (let i = 0; i < 12; i += 1) {
  const angle = ((i * 30 - 90) * Math.PI) / 180
  const major = i % 3 === 0
  const line = document.createElementNS(ns, 'line')
  line.setAttribute('x1', String(60 + Math.cos(angle) * (major ? 44 : 46)))
  line.setAttribute('y1', String(60 + Math.sin(angle) * (major ? 44 : 46)))
  line.setAttribute('x2', String(60 + Math.cos(angle) * 50))
  line.setAttribute('y2', String(60 + Math.sin(angle) * 50))
  line.setAttribute('class', major ? 'analog__tick analog__tick--major' : 'analog__tick')
  ticks.appendChild(line)
}

sill.onData(({ data }) => {
  const now = data.now ?? {}
  const when = now.iso ? new Date(now.iso) : null
  const valid = when instanceof Date && Number.isFinite(when.getTime())
  const hour = valid ? when.getHours() : 0
  const minute = valid ? when.getMinutes() : 0
  const second = valid ? when.getSeconds() : 0

  hourHand.setAttribute('transform', `rotate(${hour * 30 + minute * 0.5} 60 60)`)
  minHand.setAttribute('transform', `rotate(${minute * 6 + second * 0.1} 60 60)`)
  secHand.setAttribute('transform', `rotate(${second * 6} 60 60)`)
  tz.textContent = now.tz ?? ''
})
