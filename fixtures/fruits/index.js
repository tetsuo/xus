const runtime = require("../../lib/runtime")
const Template = runtime.Template

function Text (text) { this.text = text }

function Node (tag, props, children) {
  this.tag = tag
  this.props = props
  this.children = children
}

var render = require("./x.html")

var tree = render({
  title: "fruits",
  fruits: [
    { name: "Kiwi" },
    { name: "Mango" }
  ]
}, { VNodeClass: Node, VTextClass: Text }, Template)

console.log(tree.children)