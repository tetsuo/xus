import through = require("through2")
import { LexerToken, LexerTokenIndex, LexerTokenKind } from "./lexer"
import { ParseTree, ParseTreeIndex, ParseTreeKind } from "./runtime"
const fromArray = require("from2-array")

enum ParserState { InText = 0, InTag }

/**
 * Returns a duplex stream that takes rows of [[LexerToken]]s and produces rows of [[ParseTree]]s.
 */
export function parse(): NodeJS.ReadWriteStream {
    let state: ParserState = ParserState.InText
    let cursor: ParseTree = null
    let top: (ParseTree | string /* text node */)[][] = []

    let treeCount = 0

    return through.obj(function(token: LexerToken, enc, next) {
        const self = this
        const kind = token.shift()

        let node: ParseTree | string /* text node */
        let pending = false

        function write(newNode: any[]) { self.push(newNode) }

        switch (kind) {
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

                const attrs = node[ParseTreeIndex.Attrs]
                let pendingCount = Object.keys(attrs).length

                if (Object.keys(attrs).length) {
                    pending = true

                    Object.keys(attrs).forEach(attrKey => {
                        const attrParser = parse()

                        const attrTokens = [
                            [ LexerTokenKind.Open, "root", {} ],
                            [ LexerTokenKind.Close, "root", {} ]
                        ]
                        attrTokens.splice(1, 0, ...attrs[attrKey])

                        fromArray.obj(attrTokens).pipe(attrParser)

                        attrParser.once("data", attrNode => {
                            node[ParseTreeIndex.Attrs][attrKey] = attrNode[ParseTreeIndex.Children]
                        })

                        attrParser.on("end", () => {
                            if (--pendingCount === 0) {
                                next()
                            }
                        })
                    })
                }

                top.push(node[ParseTreeIndex.Children])

                break

            case LexerTokenKind.Close:
                node = cursor

                if (cursor[ParseTreeIndex.Parent] === null) {
                    state = ParserState.InText
                    cursor = null
                    top = []
                    node.splice(-1, 1, ++treeCount)
                    write(node)
                } else {
                    state = ParserState.InTag
                    cursor = cursor[ParseTreeIndex.Parent] as ParseTree
                    top.pop()
                    node.splice(-1, 1, ++treeCount)
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
                    token[LexerTokenIndex.VariableName] as string /* section/variable reference */
                ]

                top[top.length - 1].push(node)

                break

            case LexerTokenKind.InvertedSectionOpen:
            case LexerTokenKind.SectionOpen:
                if (state === ParserState.InText) {
                    this.emit("error", new Error("top-level section"))
                    break
                }

                node = [
                    kind === LexerTokenKind.SectionOpen
                        ? ParseTreeKind.Section
                        : ParseTreeKind.InvertedSection,
                    token[LexerTokenIndex.SectionName] as string /* section reference */, []
                ]

                top.push(node[ParseTreeIndex.Children])
                top[top.length - 2].push(node)

                break

            case LexerTokenKind.SectionClose:
                top.pop()

                break

            default:
        }

        if (!pending) {
            next()
        }
    })
}
