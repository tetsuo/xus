const runtime = require("../../lib/runtime")
const Template = runtime.Template
var VNode = require("virtual-dom/vnode/vnode")
var VText = require("virtual-dom/vnode/vtext")
var createElement = require("virtual-dom/create-element")

var render = require("./layout.html")

var virtualTree = render({
  title: "Fruits",
  fruits: [
    { name: "Kiwi" },
    { name: "Mango" }
  ]
}, { VNodeClass: VNode, VTextClass: VText }, Template)

var rootNode = createElement(virtualTree)
document.body.appendChild(rootNode)