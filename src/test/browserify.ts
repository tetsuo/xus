import transform = require("../transform")
import browserify = require("browserify")
import test = require("tape")
import vm = require("vm")
import {fixturesDir} from "./util"

test("browserify transform", t => {
    const expected = require(fixturesDir + "/fruits/expected.json")
    browserify(fixturesDir + "/fruits/index.js")
        .transform(transform.browserify)
        .bundle((er, src) => {
            if (er) {
                throw er
            }
            vm.runInNewContext(src.toString(), {
                console: {
                    log: function(s) {
                        t.deepEqual(s, expected)
                        t.end()
                    }
                }
            })
        })
})
