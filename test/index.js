import DoodlePad from '../module/index.js'

const inputer = (name, type, oninput, props = {}) => {
  const div = document.createElement('div')
  div.classList.add('inputer')
  const input = document.createElement('input')
  const label = document.createElement('label')
  const output = document.createElement('output')

  Object.entries(props).forEach(([prop, value]) =>
    input.setAttribute(prop, value)
  )

  if (type) {
    input.type = type
  }

  function eventHandler(event) {
    oninput(event)
    output.value = input.value
    output.textContent = input.value
    // console.log(dp.state)
  }

  input.addEventListener('input', eventHandler)
  input.addEventListener('change', eventHandler)
  input.addEventListener('click', eventHandler)

  label.textContent = `${name} `
  div.appendChild(label)
  div.appendChild(input)
  div.appendChild(output)
  document.body.appendChild(div)

  eventHandler({ currentTarget: input })

  return { label, input, output }
}

const canvas = document.createElement('canvas')
canvas.width = 500
canvas.height = 500
const ctx = canvas.getContext('2d')
const dp = new DoodlePad(ctx)
dp.state.strokeColor = '#5555'
canvas.draw = dp

document.body.appendChild(canvas)

inputer(
  'backgroundColor',
  'color',
  (event) => {
    dp.state.backgroundColor = event.currentTarget.value
    dp.render()
  },
  { value: '#fafafa' }
)

inputer(
  'strokeWidth',
  'range',
  (event) => {
    dp.state.strokeWidth = parseInt(event.currentTarget.value)
  },
  { value: 10 }
)

inputer('strokeColor', 'color', (event) => {
  dp.state.strokeColor = event.currentTarget.value
})

inputer(
  'strokeSmoothing',
  'checkbox',
  (event) => {
    dp.state.strokeSmoothness = event.currentTarget.checked ? 1 : 0
  },
  { checked: true }
)

inputer('lowQuality', 'checkbox', (event) => {
  dp.state.lowQuality = event.currentTarget.checked
})

inputer('undo', 'button', (event) => dp.undo())
inputer('redo', 'button', (event) => dp.redo())
