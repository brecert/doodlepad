"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * groups an array into nth parts
 * @param {T[]} array the initial array
 * @param {number} nth every nth to seperate
 * @returns {T[][]}
 * @template T
 */
exports.groupNth = function (array, nth) {
    return array.reduce(
    /**
     * @param  {T[][]} acc
     * @param  {T} item
     */
    function (acc, item) {
        var last = acc[acc.length - 1];
        if (last.length < nth) {
            last.push(item);
            return acc;
        }
        else {
            return __spreadArrays(acc, [[item]]);
        }
    }, [[]]);
};
/**
* get the middle position of two points
* @param {IPoint} from
* @param {IPoint} to
*/
exports.getMidPos = function (from, to) { return [
    (from[0] + to[0]) >> 1,
    (from[1] + to[1]) >> 1
]; };
/**
 * draw a line from a point to a point
 * @param {CanvasRenderingContext2D} ctx
 * @param {IPoint} from
 * @param {IPoint} to
 */
exports.lineFromTo = function (ctx, from, to) {
    ctx.lineTo.apply(ctx, from);
    ctx.lineTo.apply(ctx, to);
};
/**
 * draw a basic curve from a point to a point
 * @param {CanvasRenderingContext2D} ctx
 * @param {IPoint} from
 * @param {IPoint} to
 */
exports.curveFromTo = function (ctx, from, to) {
    var mid = exports.getMidPos(from, to);
    ctx.bezierCurveTo(from[0], from[1], mid[0], mid[1], to[0], to[1]);
};
