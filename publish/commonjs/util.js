"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lerpPoint = exports.lerp = exports.distanceBetween = void 0;
const distanceBetween = (a, b) => Math.sqrt(((b[0] - a[0]) ** 2) + ((b[1] - a[1]) ** 2));
exports.distanceBetween = distanceBetween;
const lerp = (v0, v1, t) => v0 + t * (v1 - v0);
exports.lerp = lerp;
const lerpPoint = (a, b, t) => [
    exports.lerp(a[0], b[0], t),
    exports.lerp(a[1], b[1], t)
];
exports.lerpPoint = lerpPoint;
