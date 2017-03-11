import test = require("tape")
import compile = require("../compile")
import tokenize = require("../tokenize")
import fs = require("fs")
import {fixturesDir} from "./util"

test("build tree", t => {
    [
        "tree"
    ].forEach(name => {
        const expectedPath = fixturesDir + "/" + name + "/expected.json"
        const layoutPath = fixturesDir + "/" + name + "/x.html"
        const expected = require(expectedPath)
        fs.createReadStream(layoutPath)
            .pipe(tokenize.stache())
            .pipe(compile.buildTree())
            .once("data", data => {
                t.deepEqual(data, expected)
                t.end()
            })
    })
})
