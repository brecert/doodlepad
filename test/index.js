import DoodlePad from '../src/index.js'

const canvas = document.createElement('canvas')
canvas.width = 500
canvas.height = 500
const ctx = canvas.getContext('2d')
const dp = new DoodlePad({ ctx })
dp.state.strokeStyle = '#5555'
canvas.draw = dp

const backgroundColorInput = document.createElement('input')
backgroundColorInput.type = 'color'
backgroundColorInput.addEventListener('input', event => {
	dp.state.backgroundColor = event.currentTarget.value
	dp.render()
})

document.body.appendChild(backgroundColorInput)
document.body.appendChild(canvas)