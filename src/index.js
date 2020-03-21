// todo: import only what's needed
import { curveBasis } from 'd3-shape'
import { groupNth, curveFromTo, lineFromTo } from './utils.js'

export const EnumSmoothLevel = {
  NONE: 0,
  BASIC: 1,
  ADVANCED: 2
}

/**
 * Creates a new drawing area context
 * @class
 * @param {object} props
 * @param {CanvasRenderingContext2D} props.ctx The context to render on to.
 */
export default function DrawingArea({ ctx }) {
  /** 
   * The stroke state that is used for rendering.
   * @type {IStroke[]}
   */
  const strokes = [];
  const curve = curveBasis(ctx);
  /** @type {IStroke[]} */
  let redoCache = [];
  let isDrawing = false;

  /**
   * @type {IDrawingAreaState}
   */
  const state = {
    lineWidth: 10,
    strokeStyle: "#000000",
    smoothing: EnumSmoothLevel.NONE,
    
    // todo: rename
    powerSaver: false,
  };

  /**
   * Gets the position of an event relative to the canvas location.
   * @param {object} event
   * @param {number} event.clientX
   * @param {number} event.clientY
   */
  function getCursorPosition(event) {
    const rect = ctx.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - ctx.canvas.clientLeft;
    const y = event.clientY - rect.top - ctx.canvas.clientTop;
    return { x, y };
  }

  /**
   * Renders a stroke to the context as is.
   * @param {IStroke} stroke The stroke to render.
   */
  function renderStroke(stroke) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (stroke.smoothing === EnumSmoothLevel.ADVANCED) {
      curve.lineStart();
      stroke.points.forEach(point => curve.point(...point));
      if (stroke.points.length === 1) curve.point(...stroke.points[0]);
      curve.lineEnd();
    } else if (stroke.smoothing === EnumSmoothLevel.BASIC) {
      groupNth(stroke.points, 2).forEach(([from, to], i) => {
        if (!from) return;
        curveFromTo(ctx, from, to || from);
      });
    } else {
      groupNth(stroke.points, 2).forEach(([from, to], i) => {
        if (!from) return;
        lineFromTo(ctx, from, to || from);
      });
    }
    ctx.lineWidth = stroke.lineWidth;
    ctx.strokeStyle = stroke.strokeStyle;
    ctx.stroke(); 
  }

  /**
   * Rerenders all strokes in the state to the context.
   */
  function render() {
    if(state.backgroundColor) {
      ctx.fillStyle = state.backgroundColor
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    } else {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    strokes.forEach(renderStroke);
  }
  
  /**
   * Uundo a stroke and add it to the redo state.
   */  
  function undoStroke() {
    if (strokes.length >= 1) {
      // @ts-ignore
      redoCache.push(strokes.pop());
      render();
    }
  }

  /**
   * Redo a stroke and add it back to the undo state.
   */
  function redoStroke() {
    if (redoCache.length >= 1) {
      // @ts-ignore
      strokes.push(redoCache.pop());
      render();
    }
  }
  
  /**
   * @param {IGenericEvent} event
   */
  function drawStartHandler(event) {
    isDrawing = true;
    redoCache = [];
    const pos = getCursorPosition(event);

    /**
     * @type {IStroke}
     */
    const stroke = {
      points: [[pos.x, pos.y]],
      lineWidth: state.lineWidth,
      strokeStyle: state.strokeStyle,
      smoothing: state.smoothing
    };

    strokes.push(stroke);
    render();
  }

  /**
   * @param {IGenericEvent} event 
   */
  function drawHandler(event) {
    if (isDrawing) {
      const pos = getCursorPosition(event);
      strokes[strokes.length - 1].points.push([pos.x, pos.y]);
      
      if(state.powerSaver) {
        renderStroke(strokes[strokes.length - 1]);
      } else {
        render()
      }
    }
  }

  /**
   * @param {IGenericEvent} event 
   */
  function drawStopHandler(event) {
    isDrawing = false;
    render();
  }
  
  /**
   * @param {(event: IGenericEvent) => void | any} fn
   * @param {TouchEvent} e 
   */
  const handleTouchEvent = (fn, e) => {
    if(isDrawing) {
      e.preventDefault()
    }
    fn(e.touches[0])
  }

  /**
   * @type {any}
   */
  const handler = {
    /** @param {TouchEvent|MouseEvent} e */
    handleEvent(e) {
      this['on'+e.type](e)
    },

    onmousedown: drawStartHandler,

    /** @param {TouchEvent} e */
    ontouchstart: e => handleTouchEvent(drawStartHandler, e),

    onmousemove: drawHandler,

    /** @param {TouchEvent} e */
    ontouchmove: e => handleTouchEvent(drawHandler, e),

    onmouseup: drawStopHandler,

    /** @param {TouchEvent} e */
    ontouchend: e => handleTouchEvent(drawStopHandler, e)
  }

  // todo: use handleEvent
  ctx.canvas.addEventListener("mousedown", handler);
  ctx.canvas.addEventListener("touchstart", handler);
  window.addEventListener("mousemove", handler);
  window.addEventListener("touchmove", handler);
  window.addEventListener("mouseup", handler);
  window.addEventListener("touchend", handler);

  this.context = ctx;
  this.state = state;
  this.undo = undoStroke;
  this.redo = redoStroke;
  this.render = render;
  this.renderStroke = renderStroke;
  this.strokes = strokes;
  this.removeEventListeners = () => {
    ctx.canvas.removeEventListener("mousedown", handler);
    ctx.canvas.removeEventListener("touchstart", handler);
    window.removeEventListener("mousemove", handler);
    window.removeEventListener("touchmove", handler);
    window.removeEventListener("mouseup", handler);
    window.removeEventListener("touchend", handler);
  }

  return this;
}
