import { distanceBetween, lerpPoint } from "./util.js";

export type Point = [number, number];

export interface StrokeStyle {
  size: number;
  color: string;
  smoothing: number
}

export interface Stroke {
  style: StrokeStyle;
  points: Point[];
}

export interface PointerData {
  emulated: Point
  lastPoint: Point
}

export interface ActivePointerData extends PointerData {
  smoothingFn?: number
}

export class Doodlepad {
  activeStrokes: Map<number, Stroke> = new Map();
  pointerData: Map<number, ActivePointerData> = new Map();
  strokeHistory: Stroke[] = [];
  undoHistory: Stroke[] = [];

  style = {
    backgroundColor: '#fff'
  }

  strokeStyle: StrokeStyle = {
    size: 5,
    color: "#2685CB",
    smoothing: 0.1
  };

  set strokeSize(size: number) {
    this.strokeStyle.size = size;
    this.ctx.lineWidth = size;
  }

  set strokeColor(color: string) {
    this.strokeStyle.color = color;
    this.ctx.strokeStyle = color;
  }

  set strokeSmoothing(num: number) {
    this.strokeStyle.smoothing = Math.max(1 - num, 0.05)
  }

  setCanvasStyle(style: StrokeStyle) {
    this.ctx.lineWidth = style.size;
    this.ctx.strokeStyle = style.color;
  }

  constructor(public ctx: CanvasRenderingContext2D, public target = ctx.canvas) {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

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

  drawPoint({ point, stroke, pointerData }: { pointerData: PointerData, point: Point; stroke: Stroke }) {
    this.ctx.beginPath();
    this.ctx.quadraticCurveTo(pointerData.emulated[0], pointerData.emulated[1], point[0], point[1]);
    this.ctx.stroke();

    pointerData.emulated = point
  }

  handlePoint({ pointerData, stroke, point }: { pointerData: PointerData, stroke: Stroke; point: Point }) {
    this.drawPoint({
      point,
      stroke,
      pointerData
    });


    stroke.points.push(point);
    if (this.undoHistory.length > 0)
      this.undoHistory = []
  }

  moveTowardsPointer(pointerData: ActivePointerData, stroke: Stroke, smoothing = stroke.style.smoothing) {
    pointerData.smoothingFn = setInterval(() => {
      const distance = distanceBetween(pointerData.emulated, pointerData.lastPoint)
      if (distance < 1) {
        return
      }

      const point = lerpPoint(pointerData.emulated, pointerData.lastPoint, smoothing)
      this.handlePoint({ pointerData, stroke, point })

      pointerData.emulated = point
    }, 5)
  }

  handleEvent(event: PointerEvent) {
    const pointerId = event.pointerId;
    const point: Point = [event.offsetX, event.offsetY];
    const stroke = this.activeStrokes.get(pointerId);
    const pointerData = this.pointerData.get(pointerId)!

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
        }

        this.pointerData.set(pointerId, pointerData)

        this.target.setPointerCapture(pointerId);
        this.handlePoint({ pointerData: pointerData, stroke, point });

        break;
      }

      case "pointermove": {
        if (stroke) {
          clearTimeout(pointerData.smoothingFn)

          event.getCoalescedEvents().forEach((e) => {
            const lerped = lerpPoint(pointerData.emulated, [e.offsetX, e.offsetY], stroke.style.smoothing);

            this.handlePoint({
              stroke,
              point: lerped,
              pointerData
            })
          });

          const lerped = lerpPoint(pointerData.emulated, point, stroke.style.smoothing);

          this.handlePoint({ stroke, point: lerped, pointerData: this.pointerData.get(pointerId)! });

          pointerData.lastPoint = point
          pointerData.smoothingFn = setTimeout(() => this.moveTowardsPointer(pointerData, stroke), 10)
        }
        break;
      }

      case "pointerup":
      case "pointerout":
      case "pointerleave":
      case "pointercancel": {
        if (stroke) {
          this.handlePoint({ stroke, point, pointerData });
          clearTimeout(pointerData.smoothingFn)

          this.strokeHistory.push(stroke);
          this.activeStrokes.delete(pointerId);
          this.target.releasePointerCapture(pointerId);
        }
        break;
      }
    }
  }

  render() {
    this.ctx.fillStyle = this.style.backgroundColor
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.strokeHistory.forEach((stroke) => {
      this.setCanvasStyle(stroke.style);
      const pointerData: PointerData = {
        emulated: stroke.points[0],
        lastPoint: stroke.points[0]
      }

      stroke.points.forEach((point) => {
        this.drawPoint({ point, stroke, pointerData });
      });
    });

    this.setCanvasStyle(this.strokeStyle);
  }

  undoStroke() {
    const stroke = this.strokeHistory.pop()
    if (stroke) {
      this.undoHistory.push(stroke)
      this.render()
    }
  }

  redoStroke() {
    const stroke = this.undoHistory.pop();
    if (stroke) {
      this.strokeHistory.push(stroke)
      this.render()
    }
  }
}
