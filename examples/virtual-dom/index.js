const runtime = require("../../lib/runtime")
const Template = runtime.Template
const VNode = require("virtual-dom/vnode/vnode")
const VText = require("virtual-dom/vnode/vtext")
const createElement = require("virtual-dom/create-element")

const render = require("./layout.html")

const virtualTree = render({
  title: "Fruits",
  fruits: [
    { name: "Kiwi" },
    { name: "Mango" }
  ]
}, { VNodeClass: VNode, VTextClass: VText }, Template)

const rootNode = createElement(virtualTree)
document.body.appendChild(rootNode)