import test = require("tape")
import tokenize = require("../tokenize")
import fs = require("fs")

const fixturesDir = __dirname + "/../../fixtures"

test("tokenize", t => {
    let len = 0;

    [
        "html-only-table",
        "table"
    ].forEach(name => {
        const expectedPath = fixturesDir + "/" + name + "/expected.json"
        const layoutPath = fixturesDir + "/" + name + "/table.html"
        const expected = require(expectedPath)
        len = len + expected.length
        t.plan(len)
        fs.createReadStream(layoutPath)
            .pipe(tokenize.stache())
            .on("data", data => {
                const x = expected.shift()
                t.deepEqual(data.filter(Boolean), x)
            })
    })
})
