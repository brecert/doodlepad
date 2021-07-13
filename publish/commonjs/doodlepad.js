"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doodlepad = void 0;
const util_js_1 = require("./util.js");
class Doodlepad {
    ctx;
    target;
    activeStrokes = new Map();
    pointerData = new Map();
    strokeHistory = [];
    undoHistory = [];
    style = {
        backgroundColor: '#fff'
    };
    strokeStyle = {
        size: 5,
        color: "#2685CB",
        smoothing: 0.1
    };
    set backgroundColor(color) {
        this.style.backgroundColor = color;
        this.render();
    }
    set strokeSize(size) {
        this.strokeStyle.size = size;
        this.ctx.lineWidth = size;
    }
    set strokeColor(color) {
        this.strokeStyle.color = color;
        this.setCanvasStyle(this.strokeStyle);
    }
    set strokeSmoothing(num) {
        this.strokeStyle.smoothing = Math.max(1 - num, 0.05);
    }
    setStrokeStyle(style) {
        this.setCanvasStyle(this.strokeStyle = style);
    }
    setCanvasStyle(style) {
        this.ctx.lineWidth = style.size;
        this.ctx.strokeStyle = style.color === 'currentBackground' ? this.style.backgroundColor : style.color;
    }
    constructor(ctx, target = ctx.canvas) {
        this.ctx = ctx;
        this.target = target;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const options = { capture: true, passive: true };
        [
            "pointerdown",
            "pointermove",
            "pointerup",
            "pointerout",
            "pointercancel",
            "pointerleave",
        ].forEach((eventName) => target.addEventListener(eventName, this, options));
    }
    drawPoint({ point, stroke, pointerData }) {
        this.ctx.beginPath();
        this.ctx.quadraticCurveTo(pointerData.emulated[0], pointerData.emulated[1], point[0], point[1]);
        this.ctx.stroke();
        pointerData.emulated = point;
    }
    handlePoint({ pointerData, stroke, point }) {
        this.drawPoint({
            point,
            stroke,
            pointerData
        });
        stroke.points.push(point);
        if (this.undoHistory.length > 0)
            this.undoHistory = [];
    }
    moveTowardsPointer(pointerData, stroke, smoothing = stroke.style.smoothing) {
        pointerData.smoothingFn = setInterval(() => {
            const distance = util_js_1.distanceBetween(pointerData.emulated, pointerData.lastPoint);
            if (distance < 1) {
                return;
            }
            const point = util_js_1.lerpPoint(pointerData.emulated, pointerData.lastPoint, smoothing);
            this.handlePoint({ pointerData, stroke, point });
            pointerData.emulated = point;
        }, 5);
    }
    handleEvent(event) {
        const pointerId = event.pointerId;
        const point = [event.offsetX, event.offsetY];
        const stroke = this.activeStrokes.get(pointerId);
        const pointerData = this.pointerData.get(pointerId);
        switch (event.type) {
            case "pointerdown": {
                const stroke = {
                    style: { ...this.strokeStyle },
                    points: [point],
                };
                this.activeStrokes.set(pointerId, stroke);
                const pointerData = {
                    emulated: point,
                    lastPoint: point,
                };
                this.pointerData.set(pointerId, pointerData);
                this.target.setPointerCapture(pointerId);
                this.handlePoint({ pointerData: pointerData, stroke, point });
                break;
            }
            case "pointermove": {
                if (stroke) {
                    clearTimeout(pointerData.smoothingFn);
                    event.getCoalescedEvents().forEach((e) => {
                        const lerped = util_js_1.lerpPoint(pointerData.emulated, [e.offsetX, e.offsetY], stroke.style.smoothing);
                        this.handlePoint({
                            stroke,
                            point: lerped,
                            pointerData
                        });
                    });
                    const lerped = util_js_1.lerpPoint(pointerData.emulated, point, stroke.style.smoothing);
                    this.handlePoint({ stroke, point: lerped, pointerData: this.pointerData.get(pointerId) });
                    pointerData.lastPoint = point;
                    pointerData.smoothingFn = setTimeout(() => this.moveTowardsPointer(pointerData, stroke), 10);
                }
                break;
            }
            case "pointerup":
            case "pointerout":
            case "pointerleave":
            case "pointercancel": {
                if (stroke) {
                    this.handlePoint({ stroke, point, pointerData });
                    clearTimeout(pointerData.smoothingFn);
                    this.strokeHistory.push(stroke);
                    this.activeStrokes.delete(pointerId);
                    this.target.releasePointerCapture(pointerId);
                }
                break;
            }
        }
    }
    render() {
        this.ctx.fillStyle = this.style.backgroundColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.strokeHistory.forEach((stroke) => {
            this.setCanvasStyle(stroke.style);
            const pointerData = {
                emulated: stroke.points[0],
                lastPoint: stroke.points[0]
            };
            stroke.points.forEach((point) => {
                this.drawPoint({ point, stroke, pointerData });
            });
        });
        this.setCanvasStyle(this.strokeStyle);
    }
    undoStroke() {
        const stroke = this.strokeHistory.pop();
        if (stroke) {
            this.undoHistory.push(stroke);
            this.render();
        }
    }
    redoStroke() {
        const stroke = this.undoHistory.pop();
        if (stroke) {
            this.strokeHistory.push(stroke);
            this.render();
        }
    }
}
exports.Doodlepad = Doodlepad;
