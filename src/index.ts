import curveBasis, { CurveGenerator } from 'd3-shape/src/curve/basis'

/**
 * @ignore
 * Gets the position of an event relative to the canvas location.
 */
function getRelativePointerPosition(
  element: HTMLElement,
  event: PointerEvent | MouseEvent
) {
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left - element.clientLeft
  const y = event.clientY - rect.top - element.clientTop
  return { x, y }
}

export interface IPointData {
  pressure: number
}

export type TPoint = [number, number, IPointData?]

/**
 * The color of a stroke.
 * Set to 'backgroundColor' to make it the same as what the background color is, even when changed. Useful for erase tools.
 */
export type TStokeColor = string | 'backgroundColor'

/**
 * The default and simple painting stroke.
 * Just draws/paints from position to position and nothing more.
 */
export interface IStrokePaint {
  type: 'paint'
  points: TPoint[]
  strokeColor: TStokeColor
  strokeWidth: number
  strokeSmoothness: StrokeSmoothness
}

export interface IStrokeRemove {
  type: 'remove'

  /** The removed points */
  points: TPoint[]
}

export enum StrokeSmoothness {
  /**
   * No smoothing
   */
  NONE,

  /**
   * Advanced smoothing using {@link curveBasis}
   */
  ADVANCED,
}

/**
 * The state of a painting context.
 * Meant to be mutable and changed.
 */
export interface IPaintingContextState {
  /**
   * The color of a stroke.
   * Set to 'backgroundColor' to make it the same as what the background color is, even when changed. Useful for erase tools.
   */
  strokeColor: TStokeColor

  /**
   * The width of a stroke.
   */
  strokeWidth: number

  /**
   * The stroke smoothness, currently only two options.
   */
  strokeSmoothness: StrokeSmoothness

  /**
   * If low quality is enabled certain optimizations will be put in place to reduce lag while doodling.
   */
  lowQuality: boolean

  /**
   * The color of the background, if not set the background will be transparent.
   */
  backgroundColor?: string
}

export type TStroke = IStrokePaint | IStrokeRemove
export type TStrokes = TStroke[]

/** @ignore */
const DefaultEmptyStroke: IStrokePaint = {
  type: 'paint',
  points: [],
  strokeColor: '#000000',
  strokeWidth: 0,
  strokeSmoothness: 0,
}

/**
 * The painting context
 */
export default class PaintingContext {
  pointerStrokes: Map<number, TStrokes> = new Map()
  redoStack: { id: number; stroke: TStroke }[] = []

  /**
   * {@link this.strokePointers} keeps track of the positioning when rendering strokes.
   * It holds the id and the stroke count to the pointerStroke in {@link this.pointerStrokes}
   */
  strokePointers: [number, number][] = []

  /**
   * {@link this.activePointers} keeps track of what pointer event ids are currently active, and should be used for drawing
   */
  activePointers: Set<number> = new Set()

  /**
   * If the painting context is currently requesting a frame
   * used to check if requestAnimationFrame should be called again
   */
  requestingFrame = false

  /**
   * the state, meant to be modified
   */
  state: IPaintingContextState = {
    strokeColor: '#000000',
    strokeWidth: 2,
    strokeSmoothness: StrokeSmoothness.ADVANCED,
    lowQuality: false,
  }

  protected curve: CurveGenerator

  /**
   * Gets the more complex pointerStrokes and strokePointers as a single simplified object for exports, data storage, etc...
   */
  get strokes() {
    return this.strokePointers.map(
      ([id, i]) => this.pointerStrokes.get(id)?.[i] ?? DefaultEmptyStroke
    )
  }

  /**
   * Sets the more complex pointerStrokes and strokePointers from a single simplified object
   */
  set strokes(newStrokes: TStroke[]) {
    this.pointerStrokes.clear()
    this.strokePointers = []
    this.activePointers.clear()
    const strokes = this.pointerStrokes.set(-1, []).get(-1)!

    newStrokes.forEach((stroke, i) => {
      this.strokePointers.push([-1, i])
      strokes.push(stroke)
    })
  }

  constructor(public ctx: CanvasRenderingContext2D) {
    this.curve = curveBasis(ctx)
    this.registerEventListeners()
  }

  /**
   * registers all event listeners
   */
  registerEventListeners() {
    this.ctx.canvas.addEventListener('pointerdown', this, false)
    window.addEventListener('pointermove', this, false)
    window.addEventListener('pointerup', this, false)
  }

  /**
   * removes all registered event listeners
   */
  removeEventListeners() {
    this.ctx.canvas.removeEventListener('pointerdown', this, false)
    window.removeEventListener('pointermove', this, false)
    window.removeEventListener('pointerup', this, false)
  }

  /** @ignore */
  handleEvent(event: PointerEvent) {
    switch (event.type) {
      case 'pointerdown':
        return this.onStrokeStart(event)
      case 'pointermove':
        return this.onStrokePoint(event)
      case 'pointerup':
        return this.onStrokeStop(event)
    }
  }

  /** @ignore */
  onStrokeStart(event: PointerEvent) {
    event.preventDefault()
    if (!this.pointerStrokes.has(event.pointerId)) {
      this.pointerStrokes.set(event.pointerId, [])
    }

    const strokes = this.pointerStrokes.get(event.pointerId)!

    this.strokePointers.push([event.pointerId, strokes.length])

    const stroke: TStroke = {
      type: 'paint',
      points: [],
      strokeColor: this.state.strokeColor,
      strokeWidth: this.state.strokeWidth,
      strokeSmoothness: this.state.strokeSmoothness,
    }

    strokes.push(stroke)

    this.activePointers.add(event.pointerId)

    this.onStrokePoint(event)
  }

  /** @ignore */
  onStrokePoint(event: PointerEvent) {
    event.preventDefault()

    const strokes = this.pointerStrokes.get(event.pointerId)
    if (strokes && this.activePointers.has(event.pointerId)) {
      this.redoStack = []
      const { x, y } = getRelativePointerPosition(this.ctx.canvas, event)
      const point: TPoint = [x, y]
      if (event.pressure && event.pressure !== 0.5) {
        point.push({
          pressure: event.pressure,
        })
      }
      strokes[strokes.length - 1].points.push(point)
      this.update(strokes?.[strokes.length - 1])
    }
  }

  /** @ignore */
  onStrokeStop(event: PointerEvent) {
    event.preventDefault()
    this.activePointers.delete(event.pointerId)
    this.render()
  }

  update(stroke?: TStroke) {
    if (!this.requestingFrame) {
      if (this.state.lowQuality) {
        switch (stroke?.type) {
          case 'paint':
            this.renderStrokePaint(stroke)
            break
          default:
            this.render()
            break
        }
      } else {
        this.render()
      }

      if (this.activePointers.size > 0) {
        this.requestingFrame = true
        requestAnimationFrame(() => {
          this.update()
          this.requestingFrame = false
        })
      }
    }
  }

  renderBasicStroke(stroke: IStrokePaint) {
    for (let i = 0; i < stroke.points.length; i += 2) {
      const [from, to] = stroke.points.slice(i, i + 2)
      this.ctx.lineTo(from[0], from[1])
      if (to) {
        this.ctx.lineTo(to[0], to[1])
      }
    }
  }

  renderSmoothStroke(stroke: IStrokePaint) {
    this.curve.lineStart()
    stroke.points.forEach((point) => this.curve.point(point[0], point[1]))
    this.curve.lineEnd()
  }

  renderStrokePaint(stroke: IStrokePaint) {
    this.ctx.strokeStyle =
      stroke.strokeColor === 'backgroundColor'
        ? this.state.backgroundColor || '#fff'
        : stroke.strokeColor
    this.ctx.lineWidth = stroke.strokeWidth
    this.ctx.beginPath()
    if (stroke.strokeSmoothness === StrokeSmoothness.NONE) {
      this.renderBasicStroke(stroke)
    } else {
      this.renderSmoothStroke(stroke)
    }
    this.ctx.stroke()
  }

  /**
   * Rerenders the entire state
   */
  render() {
    this.ctx.lineJoin = 'round'
    this.ctx.lineCap = 'round'

    if (this.state.backgroundColor) {
      this.ctx.fillStyle = this.state.backgroundColor
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.width)
    } else {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    }

    this.strokes.forEach((stroke) => {
      if (stroke.type === 'paint') {
        this.renderStrokePaint(stroke)
      } else if (stroke.type === 'remove') {
        throw new Error(
          'Remove is unimplemented, please use strokes with their color set to "backgroundColor"'
        )
      } else {
        // for js users
        throw new Error(`Invalid stroke type: ${(stroke as any).type}`)
      }
    })
  }

  /**
   * Undos a stroke.
   */
  undo() {
    if (this.strokePointers.length >= 1) {
      const [id, sid] = this.strokePointers.pop()!
      const strokes = this.pointerStrokes.get(id)
      if (strokes !== undefined) {
        const stroke = strokes.splice(sid, 1)[0]
        this.redoStack.push({ id, stroke })
        this.render()
      }
    }
  }

  /**
   * Redos a stroke that's undo'd.
   */
  redo() {
    if (this.redoStack.length >= 1) {
      const { id, stroke } = this.redoStack.pop()!
      const strokes = this.pointerStrokes.get(id)
      if (strokes) {
        const sid = strokes.push(stroke)
        this.strokePointers.push([id, sid - 1])
        this.update(stroke)
        this.render()
      } else {
        throw new Error('pointerStrokes redo id does not exist!')
      }
    }
  }
}
