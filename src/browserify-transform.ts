import path = require("path")
import through = require("through2")
import transform = require("./transform")
const duplexify = require("duplexify")

/**
 * Browserify transform for precompiling stache input and producing a module.
 *
 * @param file  An HTML file to transform.
 */
module.exports = function(file: string, opts?: any): NodeJS.ReadWriteStream {
    if (".html" !== path.extname(file)) {
        return through()
    }

    const tr = through()
    const pack = transform.pack()

    pack.once("data", data => {
        tr.end("module.exports=" + String(data))
    })

    return duplexify(pack, tr)
}
