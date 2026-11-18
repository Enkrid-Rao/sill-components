const os = require('node:os')

document.querySelector('#host').textContent = os.hostname()

sill.ready(({ data }) => {
  document.querySelector('#time').textContent = data.now?.time ?? '--:--'
})
