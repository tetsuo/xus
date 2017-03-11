import tokenize = require("./tokenize")
import compile = require("./compile")
import through = require("through2")
const pumpify = require("pumpify")

/**
 * Given a stache string as input, will produce rows of compiled function for each top-level node.
 */
export function pack() {
    const tr = through.obj(function(row, enc, next) {
        this.push(compile.toFunction(row))
        next()
    })
    return pumpify.obj(tokenize.stache(), compile.buildTree(), tr)
}
