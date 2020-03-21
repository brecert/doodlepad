type IPoint = [number, number]

declare enum ESmoothLevel {
	NONE,
	BASIC,
	ADVANCED
}

interface IStroke {
	points: IPoint[]
	lineWidth: number
	strokeStyle: string
	smoothing: ESmoothLevel
}

interface IGenericEvent {
	clientX: number
	clientY: number
}

interface IDrawingAreaState {
	lineWidth: number
	strokeStyle: string
	smoothing: ESmoothLevel
	powerSaver: boolean
}

interface IDrawingAreaParams {
	/**
	 * The context to render to.
	 */
	ctx: CanvasRenderingContext2D
}

/**
 * A drawing area that uses the ctx to render doodles on.
 */
declare class DrawingArea {
	public context: CanvasRenderingContext2D

	/**
	 * The state that's meant to be used to modify stroke data.
	 */
	public state: IDrawingAreaState
	public strokes: IStroke[]
	public constructor(params: IDrawingAreaParams)

	/**
	 * Undoes a stroke and puts the stroke into the redo state.
	 */
	public undo(): void

	/**
	 * Redoes a stroke and put the stroke back into the undo cache.
	 */
	public redo(): void

	/**
	 * Rerenders the state to the context.
	 */
	public render(): void

	/**
	 * Renders a stroke the the context as is.
	 * @param stroke The stroke to render
	 */
	public renderStroke(stroke: IStroke): void
}

declare function DrawingArea(params: IDrawingAreaParams): DrawingArea