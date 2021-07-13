import { Doodlepad } from "../publish/module/doodlepad.js";

const h = (tag, props, children) => {
  const $el = document.createElement(tag);

  for (let propName in props) {
    const prop = props[propName];
    typeof prop === "string"
      ? $el.setAttribute(propName, prop)
      : Reflect.set($el, propName, prop);
  }

  $el.append(...children);

  return $el;
};

const Input = (name, props = {}, oninput) => {
  const output = h("output", { for: name }, []);
  const input = h(
    "input",
    {
      id: name,
      onclick: eventHandler,
      oninput: eventHandler,
      onchange: eventHandler,
      ...props,
    },
    []
  );

  function eventHandler(event) {
    oninput(event, input);
    output.value = input.value;
    output.textContent = input.value;
  }

  function update() {
    eventHandler({ currentTarget: input });
  }

  const div = h("div", { class: "Input" }, [
    h("label", { for: name }, [name]),
    input,
    output,
  ]);

  div.update = update;
  update();

  return div;
};

// Main

const $canvas = document.createElement("canvas");
document.body.append($canvas);
$canvas.width = $canvas.clientWidth;
$canvas.height = $canvas.clientHeight;

const ctx = $canvas.getContext("2d");
const paint = new Doodlepad(ctx);

const BRUSH_LIST = [{}, { color: "currentBackground" }];

let currentBrush = BRUSH_LIST[0];

paint.setStrokeStyle(currentBrush);

const inputs = [
  Input(
    "background color",
    { type: "color", value: "#fafafa" },
    (event, input) => {
      paint.backgroundColor = input.value;
    }
  ),
  Input("stroke color", { type: "color", value: "#101010" }, (event, input) => {
    paint.strokeColor = input.value;
  }),
  Input(
    "stroke size",
    { type: "range", min: 0, max: 200, step: 1, value: 5 },
    (event, input) => {
      paint.strokeSize = input.valueAsNumber;
    }
  ),
  Input(
    "stabilization",
    { type: "range", min: 0, max: 1, step: 0.01, value: 0.75 },
    (event, input) => {
      paint.strokeSmoothing = input.valueAsNumber;
    }
  ),
  Input("erase", { type: "checkbox", checked: false }, (event, input) => {
    input.value = input.checked;

    if (input.checked) {
      // BRUSH_LIST[1].strokeSmoothing = BRUSH_LIST[1].strokeSmoothing
      currentBrush = BRUSH_LIST[1] = { ...BRUSH_LIST[0], ...BRUSH_LIST[1] };
    } else {
      currentBrush = BRUSH_LIST[0];
    }

    paint.setStrokeStyle(currentBrush);
  }),
];

document.body.prepend(h("form", {}, inputs));

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") paint.undoStroke();
  if (e.ctrlKey && e.key === "Z") paint.redoStroke();
});
