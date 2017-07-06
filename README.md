# xūs

logic-_less_ applications.

[![wercker status](https://app.wercker.com/status/6bbc534414fb612cf8854ed1816068a2/s/master "wercker status")](https://app.wercker.com/project/byKey/6bbc534414fb612cf8854ed1816068a2)

# introduction

xūs is the name of the simple templating languge, it's parser and the runtime library which is built on top of [React](https://github.com/facebook/react) and [mobx](https://github.com/mobxjs/mobx).

In combination with React and mobx, xūs can compile itself into a React-_ive_ component tree, allowing it to get notified of the changes on the `state` object and re-render the component tree when it's necessary, as how it was structured in xūs in the first place.

# install

With `npm`, or `yarn`, do:

```
npm install xus
```

You can also install the UMD bundle into the HTML with `<script>` tag:

```
<script src="//unpkg.com/xus/dist/xus.js"></script>
```

However, the prefered method is using [`browserify`](https://github.com/substack/node-browserify/) with the [`xusify`](https://github.com/tetsuo/xusify) transform which gives you pre-compiled render functions when you `require()` html files. For more information and examples, see [`xusify`](https://github.com/tetsuo/xusify).

# example

given this template:

```javascript
const template = "<p>Seconds passed: <b>{timePassed}</b></p>"
```

and this state:

```javascript
const state = mobx.observable({
  timePassed: 0
})
```

produce a `ReactElement` with `xus` and render it using `ReactDOM`:

```javascript
var options = { React: React, mobxReact: mobxReact }

xus(template, state, options, function(er, newElement) {
  if (er) throw er

  ReactDOM.render(newElement, el)
})
```

and change the `state` object every second, so the tree gets re-rendered:

```javascript
setInterval(function() {
  state.timePassed += 1
}, 1000)
```

[See this example on CodePen.](https://codepen.io/anon/pen/jwKRbg)

[See the Fruits example in the examples folder.](https://tetsuo.github.io/xus/example.html)

# language constructs

As of this writing, xūs only supports a minimal set of [mustache spec](http://mustache.github.io/mustache.5.html) that covers variable interpolation and sections only. More stuff will be coming soon, stay tuned!

## variables

template:

```
<h1>{name}</h1>
```

state:

```json
{
  "name": "Paul Atreides"
}
```

output:

```
<h1>Paul Atreides</h1>
```

## sections

A section property can be an `object`, a `boolean` or an `array` that will be iterated.

template:

```
<ul>
  {#fruits}
  <li>
    {name}
    {#vitamins}
      <span>{name}</span>
    {/vitamins}
  </li>
  {/fruits}
</ul>
```

state:

```json
{
  "fruits": [
    {
      "name": "Kiwi",
      "vitamins": [ { "name": "B-6" }, { "name": "C" } ]
    },
    {
      "name": "Mango"
    }
  ]
}
```

output:

```
<ul>
  <li>
    Kiwi
    <span>B-6</span>
    <span>C</span>
  </li>
  <li>
    Mango
  </li>
</ul>
```

# registry mechanism

You can pass in your own component factories in `options.registry`. By default, xūs will assume your HTML tags are normal HTML tags unless they resolve to something else in the `registry` you provided.

example:

```javascript
const state = { n: 1 }

function foo(props) {
    return <p className={ props.className }>
        <b>bold</b>
        { props.children }
    </p>
}

const optionsWithRegistry = {
    ...options,
    ...{
        registry: {
            foo: foo
        }
    }
}

xus("<foo class=bla><div>{n}</div></foo>", state, optionsWithRegistry, (err, res) => {
  if (err) throw err

  ReactDOM.render(res, el)
})
```

# internals

The main function that is exposed is called `xus`, and it is only good for creating React/mobx trees.

However, xūs does not ship with `React` and `mobxReact` (they need to be provided in `options`) and it can be rendered into a virtual tree (or just tree) of any kind, not necessarily into a React one.

The following example shows how you can build a `virtual-dom` tree instead of React:

```
import { Template } from "xus/runtime"
const createElement = require("virtual-dom/create-element")

const tree = render.call(new Template, { n: 1, m: 2 })

// ... you should also move props.attributes to attributes in here, but you get the idea :)

const rootNode = createElement(tree)
```

[See this example on CodePen.](https://codepen.io/anon/pen/jwKRbg)

xūs `Template`s are mainly just straight-forward `render(state, options)` methods and they can be extended very easily.

See [API Reference](https://tetsuo.github.io/xus/api/) for more information.

## typed

Installing xūs with npm brings with it type definitions for TypeScript as well.

## streams

xūs can handle nodejs streams. But this will most likely change in the future (at least for the UMD-bundle to keep the file size as small as possible).

# roadmap

This project has just started and it aims to make building reactive user layouts incredibly easy!

It's currently nowhere near the JSX (the syntax extension to JavaScript) or any of the other alternatives.

See the [Issues page](https://github.com/tetsuo/xus/issues) for a list of known bugs and planned features.
