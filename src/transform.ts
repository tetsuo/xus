import lexer = require("./lexer")
import compile = require("./compiler")
import { RenderFunction } from "./compiler"
import through = require("through2")
const pumpify = require("pumpify")
const from = require("from2")

export function toRenderFunction<N, R, T>(
    html: string,
    cb: (packError: Error, element?: RenderFunction<T>) => void) {

    const stream = pumpify.obj(fromString(html), createPacker())

    stream.on("data", (render: RenderFunction<T>) => {
        if (typeof cb === "function") {
            cb(null, render)
        }
    })

    stream.on("error", streamError => {
        if (typeof cb === "function") {
            cb(streamError)
        }
    })
}

/**
 * Given a stache string as input, will produce rows of compiled function for each top-level node.
 */
export function createPacker() {
    const tr = through.obj(function(row, enc, next) {
        this.push(compile.toFunction(row))
        next()
    })
    return pumpify.obj(lexer.tokenizeStache(), compile.buildTree(), tr)
}

/**
 * Create a stream from a string.
 */
export function fromString (s: string) {
  return from(function (size, next) {
    if (s.length <= 0) {
        return this.push(null)
    }

    const chunk = s.slice(0, size)
    s = s.slice(size)

    next(null, chunk)
  })
}
