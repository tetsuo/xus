import test = require("tape")
import {Template} from "../runtime"
import transform = require("../transform")
import {AbstractVNodeClass, AbstractVTextClass} from "./util"

test("pack", function (t) {
    const s = transform.pack()
    s.on("data", function (render) {
        t.ok(typeof render === "function")
        const actual = render.call(new Template, { s: "555" },
            { VNodeClass: AbstractVNodeClass, VTextClass: AbstractVTextClass })
        t.deepEqual(actual, {
            tag: "x", props: {},
            children: [{ text: "y" }, { text: "555" }]
        })
        t.end()
    })
    s.end("<x>y{s}</x>")
})
