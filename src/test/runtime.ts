import test = require("tape")
import {Template} from "../runtime"
import tokenize = require("../tokenize")
import compile = require("../compile")
import fs = require("fs")

const fixturesDir = __dirname + "/../../fixtures"

class AbstractVTextClass { constructor(public text) {} }
class AbstractVNodeClass { constructor(public tag, public props, public children) {} }

test("render abstract", t => {
    let len = 0

    ;
    [
        "scope"
    ].forEach(name => {
        const expectedPath = fixturesDir + "/" + name + "/expected.json"
        const layoutPath = fixturesDir + "/" + name + "/x.html"
        const statePath = fixturesDir + "/" + name + "/state.json"
        const expected = require(expectedPath)
        const state = require(statePath)
        len = len + expected.length
        t.plan(len)
        let i = -1
        fs.createReadStream(layoutPath)
            .pipe(tokenize.stache())
            .pipe(compile.buildTree())
            .on("data", data => {
                ++i

                const render = compile.toFunction(data)
                const actual = render.call(new Template, state[i], { VNodeClass: AbstractVNodeClass, VTextClass: AbstractVTextClass })
                t.deepEqual(actual, expected[i])
            })
    })
})
