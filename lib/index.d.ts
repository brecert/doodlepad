/**
 * Creates a new drawing area context
 * @class
 * @param {object} props
 * @param {CanvasRenderingContext2D} props.ctx The context to render on to.
 */
export default function DrawingArea({ ctx }: {
    ctx: CanvasRenderingContext2D;
}): this;
export default class DrawingArea {
    /**
     * Creates a new drawing area context
     * @class
     * @param {object} props
     * @param {CanvasRenderingContext2D} props.ctx The context to render on to.
     */
    constructor({ ctx }: {
        ctx: CanvasRenderingContext2D;
    });
    context: CanvasRenderingContext2D;
    state: IDrawingAreaState;
    undo: () => void;
    redo: () => void;
    render: () => void;
    renderStroke: (stroke: IStroke) => void;
    strokes: IStroke[];
}
export namespace EnumSmoothLevel {
    export const NONE: number;
    export const BASIC: number;
    export const ADVANCED: number;
}
//# sourceMappingURL=index.d.ts.map