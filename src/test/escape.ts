import test = require("tape")
import {Template} from "../runtime"
import tokenize = require("../tokenize")
import compile = require("../compile")

class AbstractVTextClass { constructor(public text) {} }
class AbstractVNodeClass { constructor(public tag, public props, public children) {} }

test("escape", function (t) {
    const s = compile.buildTree()
    const ws = tokenize.stache()
    ws.pipe(s)
    s.on("data", function (data) {
        const render = compile.toFunction(data)
        const actual = render.call(new Template, { s: "<<" },
            { escape: true, VNodeClass: AbstractVNodeClass, VTextClass: AbstractVTextClass })
        t.deepEqual(actual, {
            tag: "x", props: {},
            children: [{ text: "y&gt;y" }, { text: "&lt;&lt;" }]
        })
        t.end()
    })
    ws.end("<x>y>y{s}</x>")
})
