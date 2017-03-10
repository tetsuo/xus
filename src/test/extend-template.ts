import test = require("tape")
import {Template} from "../runtime"
import tokenize = require("../tokenize")
import compile = require("../compile")
import {inherits} from "util"

inherits(SubTemplate, Template)

function SubTemplate () { /* */ }

SubTemplate.prototype.escape = function (s) { return "qux" }

class AbstractVTextClass { constructor(public text) {} }
class AbstractVNodeClass { constructor(public tag, public props, public children) {} }

test("extend template", function (t) {
    const s = compile.buildTree()
    const ws = tokenize.stache()
    ws.pipe(s)

    s.on("data", function(data) {
        const render = compile.toFunction(data)

        const actual = render.call(null,
            { s: "555" },
            { VNodeClass: AbstractVNodeClass, VTextClass: AbstractVTextClass },
            SubTemplate // here it is
        )

        t.deepEqual(actual, {
            tag: "x", props: {},
            children: [{ text: "qux" }, { text: "qux" }]
        })

        t.end()
    })

    ws.end("<x>y{s}</x>")
})
