import test = require("tape")
import {Template} from "../runtime"
import tokenize = require("../tokenize")
import compile = require("../compile")

class AbstractVTextClass { constructor(public text) {} }
class AbstractVNodeClass { constructor(public tag, public props, public children) {} }

test("attributes", function (t) {
    const s = compile.buildTree()
    const ws = tokenize.stache()
    ws.pipe(s)
    s.on("data", function (data) {
        const render = compile.toFunction(data)
        const actual = render({ title: "qq" },
            { VNodeClass: AbstractVNodeClass, VTextClass: AbstractVTextClass },
            Template)
        t.deepEqual(actual, {
            tag: "x", props: {
                attributes: {
                    "data-qq": "555",
                    "style": "background-color: #fff; color: #ccc"
                }
            }, children: []
        })
        t.end()
    })
    ws.end(`<x data-qq="555" style="background-color: #fff; color: #ccc"></x>`)
})
