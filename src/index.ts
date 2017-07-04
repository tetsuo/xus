import { tokenize } from "./lexer"
import { parse } from "./parser"
import { render, RenderOptions, TemplateContext } from "./runtime"
import through = require("through2")
const pumpify = require("pumpify")
const from = require("from2")

export * from "./parser"
export * from "./lexer"
export * from "./runtime"

/**
 * Turns a xūs template into a reactive component tree using `React` and `mobx-react`.
 *
 * @param template  xūs template string.
 * @param state  An observable state object created with `mobx.observable`.
 * @param options  xūs does not ship with `React` and `mobx-react`, you provide them in this object.
 * @param cb  Returns a `ReactElement` which then can be rendered to DOM with `ReactDOM.render`.
 */
export function xus(template: string, state: any, options: RenderOptions, cb: (error: Error, element?: React.ReactNode, template?: string) => void) {
    if (!options ||
        (typeof options === "object") &&
        (!options.hasOwnProperty("React") ||
        !options.hasOwnProperty("mobxReact"))) {
        throw new Error("you must provide React and mobxReact")
    }

    return compile<React.ReactNode>(template, (er, ctx?) => {
        if (er) {
            return cb(er)
        }
        cb(null, render(ctx, state, options), template)
    })
}

/**
 * Given a a xūs template as input, will produce rows of pre-compiled functions that can be
 * evaluated for rendering and have the following structure:
 *
 *   `function render (state, options, constructor)`
 *
 * You can pass a `constructor` to create an execution context at runtime, or
 * use `render.call()` to bind an existing one.
 *
 * @typeparam T  Expected resulting node type, e.g. `React.ReactNode`.
 * @param template  xūs template string.
 * @param cb  If provided, the emitted rows are also passed to the callback function.
 */
export function compile<T>(template: string, cb?: (error: Error, ctx?: TemplateContext<T>) => void): NodeJS.ReadableStream {
    const wrapper = through.obj(function(tree, enc, next) {
        this.push((new Function("d" /* state */, "m" /* options */, "t" /* opt template inst */,
            "t=t?new t:this;t.root=" + JSON.stringify(tree) + ";return t.render(d,m)")) as TemplateContext<T>)
        next()
    })

    const stream = pumpify.obj(util.fromString(template), tokenize(), parse(), wrapper)

    stream.on("data", (ctx: TemplateContext<T>) => {
        if (typeof cb === "function") {
            cb(null, ctx)
        }
    })

    stream.on("error", streamError => {
        if (typeof cb === "function") {
            cb(streamError)
        }
    })

    return stream
}

/**
 * Utilities.
 */
export namespace util {
    /**
     * Create a stream from a string.
     *
     * @param s  Some string.
     */
    export function fromString (s: string): NodeJS.ReadWriteStream {
        return from(function (size, next) {
            if (s.length <= 0) {
                return this.push(null)
            }

            const chunk = s.slice(0, size)
            s = s.slice(size)

            next(null, chunk)
        })
    }
}
