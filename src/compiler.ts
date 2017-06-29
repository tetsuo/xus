import through = require("through2")
import { LexerToken, LexerTokenIndex, LexerTokenKind } from "./lexer"
import { ParseTree, ParseTreeIndex, ParseTreeKind, TemplateConstructor, TemplateOptions } from "./runtime"

export type RenderFunction<T> = (state: any, options: TemplateOptions<T>) => any

/**
 * Turns a parse tree into a pre-compiled function that can be evaluated for rendering
 * and have the following structure:
 *
 *   function render (state, options, constructor)
 *
 * You can pass a `constructor` to create an execution context at runtime, or
 * use `render.call()` to bind an existing one.
 *
 * @param tree  A parse tree.
 */
export function toFunction<T>(tree: ParseTree): RenderFunction<T> {
    return (new Function("d", "m", "t", "t=t?new t:this;t.root=" + JSON.stringify(tree) + ";return t.render(d,m)")) as RenderFunction<T>
}

enum ParserState { InText = 0, InTag }

/**
 * Compile a stream of stache tokens to parse trees.
 *
 * Returns a duplex stream that takes rows of `IToken` and produces rows of `INode` and/or `ITextNode`'s.
 */
export function buildTree(): NodeJS.ReadWriteStream {
    let state: ParserState = ParserState.InText
    let cursor: ParseTree = null
    let top: (ParseTree | string /* text node */)[][] = []

    return through.obj(function(token: LexerToken, enc, next) {
        let node: ParseTree | string /* text node */

        const self = this

        function write(newNode: any[]) { self.push(newNode) }

        switch (token.shift()) {
            case LexerTokenKind.Open:
                node = token.concat([
                    [] /* children */,
                    cursor ? cursor : null /* parent, if found */
                ]) as ParseTree

                if (state === ParserState.InText) {
                    state = ParserState.InTag
                } else {
                    top[top.length - 1].push(node)
                }

                cursor = node
                top.push(node[ParseTreeIndex.Children])

                break

            case LexerTokenKind.Close:
                node = cursor

                if (cursor[ParseTreeIndex.Parent] === null) {
                    state = ParserState.InText
                    cursor = null
                    top = []
                    write(node.slice(0, -1))
                } else {
                    state = ParserState.InTag
                    cursor = cursor[ParseTreeIndex.Parent]
                    top.pop()
                    node.splice(-1, 1)
                }

                break

            case LexerTokenKind.Text:
                node = token[LexerTokenIndex.TextNode] as string /* text node */ /* LexerTokenIndex.Body is 0 now, because it is shifted */

                if (state === ParserState.InText) {
                    if (node.match(/^[\s\xa0]+$/g)) {
                        break
                    } else {
                        this.emit("error", new Error("top-level text"))
                    }
                } else {
                    top[top.length - 1].push(node)
                }

                break

            case LexerTokenKind.Variable:
                if (state === ParserState.InText) {
                    this.emit("error", new Error("top-level variable"))
                    break
                }

                node = [
                    ParseTreeKind.Variable,
                    token[LexerTokenIndex.VariableVariable] as string /* section/variable reference */
                ]

                top[top.length - 1].push(node)

                break

            case LexerTokenKind.SectionOpen:
                if (state === ParserState.InText) {
                    this.emit("error", new Error("top-level section"))
                    break
                }

                node = [
                    ParseTreeKind.Section,
                    token[LexerTokenIndex.SectionVariable] as string /* section reference */, []
                ]

                top.push(node[ParseTreeIndex.Children])
                top[top.length - 2].push(node)

                break

            case LexerTokenKind.SectionClose:
                top.pop()

                break

            default:
        }

        next()
    })
}
