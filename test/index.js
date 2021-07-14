import { PaintingContext } from "../publish/module/doodlepad.js";

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

  input.update = update
  div.update = update;
  update();

  return div;
};

const $canvas = document.createElement("canvas");
document.body.append($canvas);
$canvas.width = $canvas.clientWidth;
$canvas.height = $canvas.clientHeight;

const ctx = $canvas.getContext("2d");
const paint = new PaintingContext(ctx);

let $strokeColor;
let $erase;

const inputs = [
  Input(
    "background color",
    { type: "color", value: "#fafafa" },
    (event, input) => {
      paint.backgroundColor = input.value;
    }
  ),
  Input("stroke color", { type: "color", value: "#101010" }, (event, input) => {
    $strokeColor = input;
    paint.strokeColor = input.value;

    if($erase) {
      $erase.checked = false
      $erase.update()
    }
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
    $erase = input;

    input.value = input.checked;
    paint.strokeColor = input.checked
      ? "currentBackground"
      : $strokeColor.value;
  }),
];

document.body.prepend(h("form", {}, inputs));

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") paint.undoStroke();
  if (e.ctrlKey && e.key === "Z") paint.redoStroke();
});

window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    $canvas.width = $canvas.clientWidth;
    $canvas.height = $canvas.clientHeight;
    paint.ctx.lineJoin = "round";
    paint.ctx.lineCap = "round";
    paint.render();
  });
});
