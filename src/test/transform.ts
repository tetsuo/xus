import test = require("tape")
import { Template } from "../runtime"
import transform = require("../transform")

test("pack stream", t => {
    const s = transform.createPacker()
    s.on("data", render => {
        t.ok(typeof render === "function")
        const actual = render.call(new Template, { s: "555" }, {
            createElement: (tag, props, children) => {
                delete props.parseTree
                delete props.traverseFn
                delete props.state
                return { tag, props, children }
            }
        })
        t.deepEqual(actual, {
            tag: "x", props: {},
            children: [ "y", "555" ]
        })
        t.end()
    })
    s.end("<x>y{s}</x>")
})

test("transform to render function", t => {
    transform.toRenderFunction("<z>{s}</z>", (er, render) => {
        t.error(er)
        const actual = render.call(new Template, { s: "333" }, {
            createElement: (tag, props, children) => {
                delete props.parseTree
                delete props.traverseFn
                delete props.state
                return { tag, props, children }
            }
        })
        t.deepEqual(actual, {
            tag: "z", props: {},
            children: [ "333" ]
        })
        t.end()
    })
})
