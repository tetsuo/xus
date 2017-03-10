import {
    IToken,
    ITokenKind,
    INode,
    INodeIndex,
    ITokenIndex,
    ITextNode,
    IStacheNodeKind,
    IVariableReference,
    ISectionReference,
    INodeTupleValue
} from "./types"
import through = require("through2")

enum State { InText = 0, InTag }

export function toFunction(tree: INodeTupleValue[]) {
    return (new Function("d", "m", "t", "t=t?new t:this;t.s(" + JSON.stringify(tree) + ");return t.r(d,m)"))
}

export function buildTree(): NodeJS.ReadWriteStream {
    let state: State   = State.InText,
        cursor: INode  = null,
        top: (INode | ITextNode)[][] = []

    return through.obj(function(token: IToken, enc, next) {
        let node: INode | ITextNode

        const self = this

        function write(node: INodeTupleValue[]) {
            self.push(node)
        }

        switch (token.shift()) {
            case ITokenKind.Open:
                node = token.concat([ [], cursor ? cursor : null ]) as INode

                if (state === State.InText) {
                    state = State.InTag
                } else {
                    top[top.length - 1].push(node)
                }

                cursor = node
                top.push(node[INodeIndex.Children])

                break

            case ITokenKind.Close:
                node = cursor

                if (cursor[INodeIndex.Parent] === null) {
                    state = State.InText
                    cursor = null
                    top = []
                    write(node.slice(0, -1))
                } else {
                    state = State.InTag
                    cursor = cursor[INodeIndex.Parent]
                    top.pop()
                    node.splice(-1, 1)
                }

                break

            case ITokenKind.Text:
                node = token[ITokenIndex.TextNode] as ITextNode // ITokenIndex.Body is 0 now, because it is shifted

                if (state === State.InText) {
                    if (node.match(/^[\s\xa0]+$/g)) {
                        break
                    } else {
                        this.emit("error", new Error("top-level text"))
                    }
                } else {
                    top[top.length - 1].push(node)
                }

                break

            case ITokenKind.Variable:
                if (state === State.InText) {
                    this.emit("error", new Error("top-level variable"))
                    break
                }

                node = [ IStacheNodeKind.Variable, token[ITokenIndex.VariableReference] as IVariableReference ]
                top[top.length - 1].push(node)

                break

            case ITokenKind.SectionOpen:
                if (state === State.InText) {
                    this.emit("error", new Error("top-level section"))
                    break
                }

                node = [ IStacheNodeKind.Section, token[ITokenIndex.SectionReference] as ISectionReference, [] ]
                top.push(node[INodeIndex.Children])
                top[top.length - 2].push(node)

                break

            case ITokenKind.SectionClose:
                top.pop()

                break

            default:
        }

        next()
    })
}
