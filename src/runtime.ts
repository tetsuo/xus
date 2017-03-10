const escapeHTML = require("escape-html")
import {
    INode,
    ITextNode,
    ICommonAttrs,
    INodeIndex,
    INodeTag,
    IStacheNodeKind,
    IStacheNodeReference,
    ITemplateRenderOptions,
    ITemplateOptions,
    IVNode,
    IVNodeAttributes,
    IVText
} from "./types"

/**
 * Renders a parse tree into a virtual tree.
 */
export class Template {
    root: INode

    options: ITemplateOptions

    constructor(options: ITemplateOptions = {}) {
        this.options = options
    }

    attrsFmt(attrs: ICommonAttrs): IVNodeAttributes {
        if (Object.keys(attrs).length) {
            return { attributes: attrs }
        }
        return {}
    }

    escape(s: string): string {
        if (this.options.escape) {
            return escapeHTML(String(s))
        }
        return String(s)
    }

    render(state: any = {}, options: ITemplateRenderOptions = {}) {
        this.options = { ...this.options, ...options }

        const {VNodeClass, VTextClass} = options
        const top: any[] = [ state ]
        let tail: any[]

        const traverse = (acc: (IVNode | IVText)[] | null, node: INode | ITextNode) => {
            if (!Array.isArray(node)) {
                if (!acc) {
                    throw new Error("top-level text")
                }
                acc.push(new VTextClass(this.escape(node)))
            } else if ("string" === typeof node[INodeIndex.Tag]) { // regular tag
                node = new VNodeClass(node[INodeIndex.Tag] as INodeTag,
                    this.attrsFmt(node[INodeIndex.Attrs] as ICommonAttrs),
                    (node[INodeIndex.Children] as (INode | ITextNode)[]).reduce<(IVNode | IVText)[] | void>(traverse, []))

                if (!acc) {
                    return node // top-level node
                } else {
                    acc.push(node) // node is child
                }
            } else if (node[INodeIndex.Kind] === IStacheNodeKind.Section) {
                tail = top[top.length - 1]
                const val = tail[node[INodeIndex.Reference] as IStacheNodeReference]
                let isarr = false

                // tslint:disable-next-line:no-conditional-assignment
                if (!val || ((isarr = Array.isArray(val)) && val.length === 0)) {
                    return acc
                }

                if (isarr) {
                    top.push(val)
                    val.forEach(function(x) {
                        top.push(x);
                        (node[INodeIndex.Children] as INode[]).reduce(traverse, acc)
                        top.pop()
                    })
                } else {
                    top.push(("object" === typeof val) ? val : tail);
                    (node[INodeIndex.Children] as INode[]).reduce(traverse, acc)
                }

                top.pop()
            } else if (node[INodeIndex.Kind] === IStacheNodeKind.Variable) {
                tail = top[top.length - 1]
                acc.push(new VTextClass(this.escape(tail[node[INodeIndex.Reference] as IStacheNodeReference])))
            }

            return acc
        }

        return traverse(null, this.root)
    }
}
