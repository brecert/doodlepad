import DoodlePad from '../src/index.js'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const dp = new DoodlePad({ ctx })

const backgroundColorInput = document.createElement('input')
backgroundColorInput.type = 'color'
backgroundColorInput.addEventListener('input', event => {
	dp.state.backgroundColor = event.currentTarget.value
	dp.render()
})

document.body.appendChild(backgroundColorInput)
document.body.appendChild(canvas)