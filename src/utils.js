/**
 * groups an array into nth parts
 * @param {T[]} array the initial array
 * @param {number} nth every nth to seperate
 * @returns {T[][]}
 * @template T
 */
export const groupNth = (array, nth) =>
  array.reduce(
    /**
     * @param  {T[][]} acc
     * @param  {T} item
     */
    (acc, item) => {
      let last = acc[acc.length - 1];

      if (last.length < nth) {
        last.push(item);
        return acc;
      } else {
        return [...acc, [item]];
      }
    },
    [[]]
  );

  /**
 * get the middle position of two points
 * @param {IPoint} from
 * @param {IPoint} to
 */
export const getMidPos = (from, to) => [
  (from[0] + to[0]) >> 1,
  (from[1] + to[1]) >> 1
];

/**
 * draw a line from a point to a point
 * @param {CanvasRenderingContext2D} ctx
 * @param {IPoint} from
 * @param {IPoint} to
 */
export const lineFromTo = (ctx, from, to) => {
  ctx.lineTo(...from);
  ctx.lineTo(...to);
}

/**
 * draw a basic curve from a point to a point
 * @param {CanvasRenderingContext2D} ctx
 * @param {IPoint} from
 * @param {IPoint} to
 */

export const curveFromTo = (ctx, from, to) => {
  const mid = getMidPos(from, to);
  ctx.bezierCurveTo(from[0], from[1], mid[0], mid[1], to[0], to[1]);
};
