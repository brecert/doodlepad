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

/**
 * Extra information and data to be stored with a point
 */
export interface IPointData {
  pressure: number
}

/**
 * A point that stores `[x, y, data]`
 */
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
   * If low quality is enabled certain optimizations will be put in place to reduce cpu/gpu usage while doodling.
   */
  lowQuality: boolean

  /**
   * The color of the background, if not set the background will be transparent.
   */
  backgroundColor?: string
}

/**
 * Placeholder type for future use if more strokes are added
 */
export type TStroke = IStrokePaint

/**
 * Placeholder type for future use if the format of `Strokes[]` changes
 */
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
  /**
   * Stores stroke list with id of the pointer making the strokes
   */
  pointerStrokes: Map<number, TStrokes> = new Map()

  /**
   * Retains strokes that have been undone for use to be redone
   */
  redoStack: { id: number; stroke: TStroke }[] = []

  /**
   * keeps track of the positioning when rendering strokes.
   * It holds the id and the stroke count to the pointerStroke in pointerStrokes
   */
  strokePointers: [number, number][] = []

  /**
   * keeps track of what pointer event ids are currently active, and should be used for drawing
   */
  activePointers: Set<number> = new Set()

  /**
   * the state, meant to be modified
   */
  state: IPaintingContextState

  /** @ignore */
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

  /**
   * sets and gets both contexes width
   */
  set width(size: number) {
    this.ctx.canvas.width = size
    this.offscreenCtx.canvas.width = size
  }

  get width() {
    return this.ctx.canvas.width
  }

  /**
   * sets and gets both contexes height
   */
  set height(size: number) {
    this.ctx.canvas.height = size
    this.offscreenCtx.canvas.height = size
  }

  get height() {
    return this.ctx.canvas.height
  }

  constructor(
    public ctx: CanvasRenderingContext2D,
    public offscreenCtx: CanvasRenderingContext2D = document
      .createElement('canvas')!
      .getContext('2d')!
  ) {
    this.state = {
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeSmoothness: StrokeSmoothness.ADVANCED,
      lowQuality: false,
    }

    this.curve = curveBasis(offscreenCtx)
    this.registerEventListeners()

    this.offscreenCtx.canvas.width = this.ctx.canvas.width
    this.offscreenCtx.canvas.height = this.ctx.canvas.height
    this.offscreenCtx.lineJoin = 'round'
    this.offscreenCtx.lineCap = 'round'

    if (typeof this.offscreenCtx === 'undefined') {
      throw new Error('offscreenCtx must be defined')
    }
  }

  /**
   * registers all event listeners
   */
  registerEventListeners() {
    this.ctx.canvas.addEventListener('pointerdown', this, false)
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
      case 'pointerdown': {
        if (this.activePointers.size === 0) {
          window.addEventListener('pointermove', this, false)
          window.addEventListener('pointerup', this, false)
        }
        this.onStrokeStart(event)
        break
      }
      case 'pointermove': {
        this.onStrokePoint(event)
        break
      }
      case 'pointerup': {
        this.onStrokeStop(event)
        if (this.activePointers.size === 0) {
          window.removeEventListener('pointermove', this, false)
          window.removeEventListener('pointerup', this, false)
        }
        break
      }
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
      const lastStroke = strokes[strokes.length - 1]
      this.drawPoint(event.pointerId, point)
      lastStroke.points.push(point)
    }
  }

  /** @ignore */
  onStrokeStop(event: PointerEvent) {
    event.preventDefault()
    this.activePointers.delete(event.pointerId)

    // rerender the scene for now, at some point in future this may not be needed
    this.render()
  }

  updateStyle(params: { strokeColor: string; strokeWidth: number }) {
    // avoids changing canvas state when possible
    if (this.offscreenCtx.strokeStyle !== params.strokeColor) {
      this.offscreenCtx.strokeStyle =
        params.strokeColor === 'backgroundColor'
          ? this.state.backgroundColor || '#fff'
          : params.strokeColor
    }

    // avoids changing canvas state when possible
    if (this.offscreenCtx.lineWidth !== params.strokeWidth) {
      this.offscreenCtx.lineWidth = params.strokeWidth
    }
  }

  /** @ignore */
  drawPoint(id: number, point: TPoint) {
    const strokes = this.pointerStrokes.get(id)
    if (strokes) {
      const lastStroke = strokes[strokes.length - 1]
      const lastPoint = lastStroke.points[lastStroke.points.length - 1] || point

      // todo: fix
      if (
        this.state.lowQuality ||
        lastStroke.strokeSmoothness === StrokeSmoothness.NONE
      ) {
        this.updateStyle(lastStroke)
        this.offscreenCtx.beginPath()
        this.offscreenCtx.moveTo(lastPoint[0], lastPoint[1])
        this.offscreenCtx.lineTo(point[0], point[1])
        this.offscreenCtx.stroke()
        this.queueCommit()
      } else {
        this.render()
      }
    } else {
      throw new Error(`No pointer stroke found for id: ${id}`)
    }
  }

  /** @ignore */
  drawBasicStroke(stroke: IStrokePaint) {
    for (let i = 0; i < stroke.points.length; i += 2) {
      const [from, to] = stroke.points.slice(i, i + 2)
      this.offscreenCtx.lineTo(from[0], from[1])
      if (to) {
        this.offscreenCtx.lineTo(to[0], to[1])
      } else {
        this.offscreenCtx.lineTo(from[0], from[1])
      }
    }
  }

  /** @ignore */
  drawSmoothStroke(stroke: IStrokePaint) {
    this.curve.lineStart()
    for (let i = 0; i < stroke.points.length; i++) {
      const point = stroke.points[i]
      this.curve.point(point[0], point[1])
    }
    if (stroke.points.length === 1) {
      const [x, y] = stroke.points[0]
      this.curve.point(x, y)
    }
    this.curve.lineEnd()
  }

  /** @ignore */
  drawPaintStroke(stroke: IStrokePaint) {
    this.updateStyle(stroke)
    this.offscreenCtx.beginPath()
    if (stroke.strokeSmoothness === StrokeSmoothness.NONE) {
      this.drawBasicStroke(stroke)
    } else {
      this.drawSmoothStroke(stroke)
    }
    this.offscreenCtx.stroke()
  }

  /** @ignore */
  drawStroke(stroke: TStroke) {
    this.drawPaintStroke(stroke)
  }

  /** @ignore */
  strokeQueued = false
  /** @ignore */
  strokeQueue: Set<number> = new Set()
  /** @ignore */
  queueStroke(id: number) {
    this.strokeQueue.add(id)

    if (!this.strokeQueued) {
      this.strokeQueued = true
      requestAnimationFrame(() => {
        this.offscreenCtx.clearRect(0, 0, this.width, this.height)
        // todo: optimize
        for (const id of this.strokeQueue.keys()) {
          const strokes = this.pointerStrokes.get(id)
          if (strokes) {
            const stroke = strokes[strokes.length - 1]
            this.drawStroke(stroke)
          }
        }
        this.strokeQueue.clear()
        this.strokeQueued = false
      })
    }
  }

  /**
   * @ignore
   * moves the data from the offscreenCtx to the ctx and clears the offscreenCtx
   */
  commitData() {
    this.ctx.drawImage(this.offscreenCtx.canvas, 0, 0)
    this.offscreenCtx.clearRect(
      0,
      0,
      this.offscreenCtx.canvas.width,
      this.offscreenCtx.canvas.height
    )
  }

  /** @ignore */
  queued = false

  /**
   * @igore
   */
  queueCommit() {
    if (!this.queued) {
      this.queued = true
      requestAnimationFrame(() => {
        this.commitData()
        this.queued = false
      })
    }
  }

  /**
   * Rerenders the entire state
   */
  render() {
    this.offscreenCtx.lineJoin = 'round'
    this.offscreenCtx.lineCap = 'round'

    if (this.state.backgroundColor) {
      if (this.offscreenCtx.fillStyle !== this.state.backgroundColor) {
        this.offscreenCtx.fillStyle = this.state.backgroundColor
      }
      this.offscreenCtx.fillRect(
        0,
        0,
        this.offscreenCtx.canvas.width,
        this.offscreenCtx.canvas.width
      )
    } else {
      this.offscreenCtx.clearRect(
        0,
        0,
        this.offscreenCtx.canvas.width,
        this.offscreenCtx.canvas.height
      )
    }

    for (let i = 0; i < this.strokePointers.length; i++) {
      const [pointerId, strokeId] = this.strokePointers[i]
      const stroke = this.pointerStrokes.get(pointerId)?.[strokeId]
      if (stroke !== undefined) {
        if (stroke.points.length === 1) {
          this.updateStyle(stroke)
          if (this.offscreenCtx.fillStyle !== stroke.strokeColor) {
            this.offscreenCtx.fillStyle = stroke.strokeColor
          }
          const [x, y] = stroke.points[0]
          this.offscreenCtx.beginPath()
          this.offscreenCtx.arc(x, y, stroke.strokeWidth / 2, 0, 2 * Math.PI)
          this.offscreenCtx.fill()
        } else {
          this.drawStroke(stroke)
        }
      }
    }
    this.queueCommit()
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
        this.render()
      } else {
        throw new Error('pointerStrokes redo id does not exist!')
      }
    }
  }
}
