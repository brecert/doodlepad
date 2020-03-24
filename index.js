import htm from '//unpkg.com/htm@3.0.3/mini/index.module.js'
import PaintingContext from '//unpkg.com/doodlepad@2.1.1/module/index.js?module'

function h(el, props, ...children) {
  el = document.createElement(el)
  for (let i in props) i in el
    ? el[i] = props[i]
    : el.setAttribute(i,props[i])
  el.append(...children)
  return el
}

const html = htm.bind(h)

const canvas = document.getElementById('canvas')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const ctx = canvas.getContext('2d')
const paint = new PaintingContext(ctx)

const state = {
	erasing: false,
	strokeColor: '#000000',
	opacity: 1
}
function updateStrokeColor() {
	paint.state.strokeColor = state.erasing ? 'backgroundColor' : state.strokeColor + Math.round(state.opacity*255).toString(16)
}

const controls = html`
	<div class="controls">
		<button onclick=${event => paint.undo()}>Undo</button>
		<button onclick=${event => paint.redo()}>Redo</button>

		<div class="input">
			<label for="strokeSize">strokeSize</label>
			<input type="range" value=${paint.state.strokeWidth} name="strokeSize" oninput=${e => paint.state.strokeWidth = parseInt(e.currentTarget.value)} />
		</div>

		<div class="input">
			<label for="strokeColor">strokeColor</label>
			<input type="color" name="stokeColor" oninput=${e => {
				state.strokeColor = e.currentTarget.value
				updateStrokeColor()
			}} />
		</div>

		<div class="input">
			<label for="opacity">opacity</label>
			<input type="range" min="0" max="1" step="any" name="opacity" oninput=${e => {
				state.opacity = parseFloat(e.currentTarget.value)
				updateStrokeColor()
			}} />
		</div>


		<div class="input">
			<label for="eraseEnabled">eraseEnabled</label>
			<input type="checkbox" name="eraseEnabled" oninput=${e => {
				state.erasing = e.currentTarget.checked
				updateStrokeColor()
			}} />
		</div>

		<div class="input">
			<label for="backgroundColor">backgroundColor</label>
			<input type="color" name="backgroundColor" oninput=${e => paint.state.backgroundColor = e.currentTarget.value} />
		</div>

		<div class="input">
			<label for="lowQuality">lowQuality</label>
			<input type="checkbox" name="lowQuality" oninput=${e => paint.state.lowQuality = e.currentTarget.checked} />
		</div>
	</div>
`

document.body.appendChild(controls)