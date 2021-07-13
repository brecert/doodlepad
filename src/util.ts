import type { Point } from "./doodlepad.js"

export const distanceBetween = (a: Point, b: Point) =>
  Math.sqrt(((b[0] - a[0]) ** 2) + ((b[1] - a[1]) ** 2))

export const lerp = (v0: number, v1: number, t: number) => v0 + t * (v1 - v0)

export const lerpPoint = (a: Point, b: Point, t: number): Point => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t)
]