import { Doodlepad } from "../publish/module/doodlepad.js";

const h = (tag, props, children) => {
  const $el = document.createElement(tag);

  for (let propName in props) {
    const prop = props[propName];
    typeof prop === "string"
      ? $el.setAttribute(propName, prop)
      : Reflect.set($el, propName, prop);
  }

  $el.append(...children)

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

  const div = h("div", { class: "Input" }, [
    h("label", { for: name }, [name]),
    input,
    output,
  ]);

  eventHandler({ currentTarget: input });

  return div;
};

const $canvas = document.createElement("canvas");
document.body.append($canvas);
$canvas.width = $canvas.clientWidth;
$canvas.height = $canvas.clientHeight;

const ctx = $canvas.getContext("2d");
const paint = new Doodlepad(ctx);


document.body.prepend(
  h('form', {}, [
    Input(
      "background color",
      { type: "color", value: "#fafafa" },
      (event, input) => {}
    ),
    Input(
      "stroke color",
      { type: "color", value: "#101010" },
      (event, input) => {
        paint.strokeColor = input.value
      }
    ),
    Input(
      "stroke size",
      { type: "range", min: 0, max: 200, step: 1, value: 5 },
      (event, input) => {
        paint.strokeSize = input.valueAsNumber
      }
    ),
    Input(
      "stabilization",
      { type: "range", min: 0, max: 1, step: 0.01, value: 0.75 },
      (event, input) => {
        paint.strokeSmoothing = input.valueAsNumber
      }
    ),
  ])
)