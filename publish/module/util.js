export const distanceBetween = (a, b) => Math.sqrt(((b[0] - a[0]) ** 2) + ((b[1] - a[1]) ** 2));
export const lerp = (v0, v1, t) => v0 + t * (v1 - v0);
export const lerpPoint = (a, b, t) => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t)
];
