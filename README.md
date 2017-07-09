# xūs

logic-_less_ applications.

[![wercker status](https://app.wercker.com/status/6bbc534414fb612cf8854ed1816068a2/s/master "wercker status")](https://app.wercker.com/project/byKey/6bbc534414fb612cf8854ed1816068a2)

# introduction

xūs is the name of the simple templating languge, it's parser and the runtime library.

**It brings the simplicity of [mustache](http://mustache.github.io/) and the expressiveness of [mobx-state-tree](https://github.com/mobxjs/mobx-state-tree) together, and makes laying out reactive user interfaces incredibly easy.**

In combination with [React](https://github.com/facebook/react) and [mobx](https://github.com/mobxjs/mobx), xūs can compile itself into an observer component tree, allowing it to get notified of the changes on the `state` and re-render the tree when it's necessary, as how it was structured in xūs in the first place.

A `state` can be a simple [`observable`](https://mobx.js.org/refguide/observable.html) value, or a more sophisticated state definition like a [mobx-state-tree](https://github.com/mobxjs/mobx-state-tree).

**More documentation coming soon.**

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

given this `template`:

```
<div>
  <p>You have completed <b>{completedCount}</b> of your tasks.</p>
  <ul>
    {#todos}
      <li class="{#done}finished{/done}" onClick="toggle">{title}</li>
    {/todos}
  </ul>
</div>
```

and this state definition:

```javascript
import { types } from "mobx-state-tree"

const Todo = types.model("Todo", {
    title: types.string,
    done: false
}, {
    toggle() {
        this.done = !this.done
    }
})

const State = types.model("State", {
    todos: types.array(Todo),
    get completedCount() {
        return this.todos.reduce((count, todo) => (todo.done ? count + 1 : count), 0)
    }
})
```

create a new `state`:

```javascript
const state = State.create({
  todos: [
    { title: "Get coffee", done: false },
    { title: "Wake up", done: true }
  ]
})
```

then produce a `ReactElement` with `xus` and render it using `ReactDOM`:

```javascript
var options = {
  createElement: React.createElement,
  observer: mobxReact.observer
}

xus(template, state, options, function(er, newElement) {
  if (er) throw er

  ReactDOM.render(newElement, el)
})
```

[See the full example here.](https://tetsuo.github.io/xus/demo.html)

[See example on CodePen.](https://codepen.io/anon/pen/Xgxqqb)

# language semantics

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

You can pass in your own component factories in `options.registry`.

By default, xūs will assume your HTML tags are normal HTML tags unless they resolve to something else in the `registry` you provided.

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

```javascript
import * as xus from "xus"
```

The main function that is exposed is called `xus`, and it's only good for creating React/mobx trees.

However, xūs does not ship with `React`, `mobx-react` and/or `mobx-state-tree`, and it can be rendered into a virtual tree (or just tree) of any kind, not necessarily into an observer component tree.

The following example shows how you can build a `virtual-dom` tree instead of React:

```javascript
import { Template } from "xus/runtime"
const createElement = require("virtual-dom/create-element")

const tree = render.call(new Template, { n: 1, m: 2 })

// ... you should also move props.attributes to attributes in here, but you get the idea :)

const rootNode = createElement(tree)
```

xūs `Template`s are mainly just straight-forward `render(state, options)` methods and they can be extended very easily.

See the [API Reference](https://tetsuo.github.io/xus/) for more information.

## typed

Installing xūs with npm brings with it type definitions for TypeScript as well.

## streams

xūs can handle nodejs streams.

# roadmap

See the [Issues page](https://github.com/tetsuo/xus/issues) for a list of known bugs and planned features.
