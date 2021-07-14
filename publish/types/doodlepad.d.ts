export declare type Point = [number, number];
export interface StrokeStyle {
    /** The size of the stroke in canvas pixels */
    size: number;
    /**
     * The color of the stroke.
     *
     * `currentBackground` will use the background of the Doodlepad instance.
     */
    color: string | 'currentBackground';
    /** The amount of smoothing to apply to the stroke. 1 is none and 0 is the maximum. */
    smoothing: number;
}
export interface Stroke {
    style: StrokeStyle;
    points: Point[];
}
export interface PointerData {
    emulated: Point;
    lastPoint: Point;
}
export interface ActivePointerData extends PointerData {
    smoothingFn?: number;
}
export declare class PaintingContext {
    ctx: CanvasRenderingContext2D;
    target: HTMLCanvasElement;
    activeStrokes: Map<number, Stroke>;
    pointerData: Map<number, ActivePointerData>;
    strokeHistory: Stroke[];
    undoHistory: Stroke[];
    style: {
        backgroundColor: string;
    };
    strokeStyle: StrokeStyle;
    set backgroundColor(color: string);
    set strokeSize(size: number);
    set strokeColor(color: string);
    /** Sets the smoothing of the stroke. 1 is the maximum amount of smoothing, 0 is no smoothing. */
    set strokeSmoothing(num: number);
    setStrokeStyle(style: StrokeStyle): void;
    setCanvasStyle(style: StrokeStyle): void;
    constructor(ctx: CanvasRenderingContext2D, target?: HTMLCanvasElement);
    drawPoint({ point, stroke, pointerData }: {
        pointerData: PointerData;
        point: Point;
        stroke: Stroke;
    }): void;
    handlePoint({ pointerData, stroke, point }: {
        pointerData: PointerData;
        stroke: Stroke;
        point: Point;
    }): void;
    moveTowardsPointer(pointerData: ActivePointerData, stroke: Stroke, smoothing?: number): void;
    handleEvent(event: PointerEvent): void;
    /** re-renders the entire stroke history. */
    render(): void;
    undoStroke(): void;
    redoStroke(): void;
}
