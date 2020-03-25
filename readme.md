# DoodlePad
> good doodle pad

A simple doodle pad to use with canvas contexes
> _todo: make generic, remove canvas context requirement_


## Demo
[demo](https://brecert.github.io/doodlepad/)

## Notes

Make sure the canvas container has this css applied to it
```
touch-action: none;
user-select: none;
overflow: hidden;
```
to prevent strokes from being mis-inputed and cancelled

## Example
```js
import PaintingContext from 'doodlepad'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const paint = new PaintingContext(ctx)

paint.state.strokeWidth = 5

document.appendChild(canvas)
```