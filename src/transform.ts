import path = require("path")
import tokenize = require("./tokenize")
import compile = require("./compile")
import through = require("through2")
const pumpify = require("pumpify")
const duplexify = require("duplexify")

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

/**
 * Browserify transform for precompiling stache input and producing a module.
 *
 * @param file  An HTML file to transform.
 */
export function browserify(file: string, opts?: any): NodeJS.ReadWriteStream {
    if (".html" !== path.extname(file)) {
        return through()
    }

    const tr = through()
    const s = pack()

    s.once("data", data => {
        tr.end("module.exports=" + String(data))
    })

    return duplexify(s, tr)
}
