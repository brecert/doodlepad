"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// todo: import only what's needed
var d3_shape_1 = require("d3-shape");
var utils_js_1 = require("./utils.js");
exports.EnumSmoothLevel = {
    NONE: 0,
    BASIC: 1,
    ADVANCED: 2
};
/**
 * Creates a new drawing area context
 * @class
 * @param {object} props
 * @param {CanvasRenderingContext2D} props.ctx The context to render on to.
 */
function DrawingArea(_a) {
    var ctx = _a.ctx;
    /**
     * The stroke state that is used for rendering.
     * @type {IStroke[]}
     */
    var strokes = [];
    var curve = d3_shape_1.curveBasis(ctx);
    /** @type {IStroke[]} */
    var redoCache = [];
    var isDrawing = false;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    /**
     * @type {IDrawingAreaState}
     */
    var state = {
        lineWidth: 10,
        strokeStyle: "#000000",
        smoothing: exports.EnumSmoothLevel.NONE,
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
        var rect = ctx.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left - ctx.canvas.clientLeft;
        var y = event.clientY - rect.top - ctx.canvas.clientTop;
        return { x: x, y: y };
    }
    /**
     * Renders a stroke to the context as is.
     * @param {IStroke} stroke The stroke to render.
     */
    function renderStroke(stroke) {
        ctx.beginPath();
        console.log(stroke.smoothing);
        if (state.smoothing === exports.EnumSmoothLevel.ADVANCED) {
            curve.lineStart();
            stroke.points.forEach(function (point) { return curve.point.apply(curve, point); });
            if (stroke.points.length === 1)
                curve.point.apply(curve, stroke.points[0]);
            curve.lineEnd();
        }
        else if (state.smoothing === exports.EnumSmoothLevel.BASIC) {
            utils_js_1.groupNth(stroke.points, 2).forEach(function (_a, i) {
                var from = _a[0], to = _a[1];
                if (!from)
                    return;
                utils_js_1.curveFromTo(ctx, from, to || from);
            });
        }
        else {
            utils_js_1.groupNth(stroke.points, 2).forEach(function (_a, i) {
                var from = _a[0], to = _a[1];
                if (!from)
                    return;
                utils_js_1.lineFromTo(ctx, from, to || from);
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
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
        var stroke = {
            points: [],
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
            var pos = getCursorPosition(event);
            strokes[strokes.length - 1].points.push([pos.x, pos.y]);
            if (state.powerSaver) {
                renderStroke(strokes[strokes.length - 1]);
            }
            else {
                render();
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
    var handleTouchEvent = function (fn, e) {
        if (isDrawing) {
            e.preventDefault();
        }
        fn(e.touches[0]);
    };
    ctx.canvas.addEventListener("mousedown", drawStartHandler);
    ctx.canvas.addEventListener("touchstart", function (e) { return handleTouchEvent(drawStartHandler, e); });
    window.addEventListener("mousemove", drawHandler);
    window.addEventListener("touchmove", function (e) { return handleTouchEvent(drawHandler, e); });
    window.addEventListener("mouseup", drawStopHandler);
    window.addEventListener("touchend", function (e) { return handleTouchEvent(drawStopHandler, e); });
    this.context = ctx;
    this.state = state;
    this.undo = undoStroke;
    this.redo = redoStroke;
    this.render = render;
    this.renderStroke = renderStroke;
    this.strokes = strokes;
    return this;
}
exports.default = DrawingArea;
