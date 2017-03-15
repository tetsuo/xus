import * as React from "react"
import {Template} from "./runtime"
const pumpify = require("pumpify")
const fromString = require("from2-string")
import transform = require("./transform")
import {observer} from "mobx-react"
import {isObservableArray} from "mobx"
import {
    INode,
    ITextNode,
    ICommonAttrs,
    INodeIndex,
    INodeTag,
    IStacheNodeKind,
    IStacheNodeReference,
    ITemplateRenderOptions,
    IVNode,
    IVText
} from "./types"

export type IbuildReactCallback = (er: Error, res?: React.ReactElement<any>) => void

export function buildReact(html: string, state: any, cb: IbuildReactCallback) {
    const stream = pumpify.obj(fromString(html), transform.pack())

    stream.on("data", render => {
        if (typeof cb === "function") {
            cb(null, render.call(new ReactTemplate, state))
        }
    })

    stream.on("error", er => {
        if (typeof cb === "function") {
            cb(er)
        }
    })
}

export class ReactTemplate extends Template {

    render(state: any = {}, options: ITemplateRenderOptions = {}) {
        this.options = { ...this.options, ...options }

        const traverse = (acc: (IVNode | IVText)[] | null, node: INode | ITextNode, top?: any, ix?: number) => {
            if (!Array.isArray(node)) {
                /* TODO */
            } else if ("string" === typeof node[INodeIndex.Tag]) {
                const tagName = node[INodeIndex.Tag] as INodeTag
                const props = this.attrsFmt(node[INodeIndex.Attrs] as ICommonAttrs)
                const children = (node[INodeIndex.Children] as (INode | ITextNode)[])
                    .reduce<(IVNode | IVText)[] | void>(function(acc1, x) {
                        return traverse(acc1 as any, x, top)
                    }, [])
                const el = React.createElement(tagName, props, children)
                if (!acc) {
                    return el // top-level node
                } else {
                    acc.push(el) // node is child
                }
            } else if (node[INodeIndex.Kind] === IStacheNodeKind.Section) {
                let isarr = false

                const tail = top[node[INodeIndex.Reference] as IStacheNodeReference]

                // tslint:disable-next-line:no-conditional-assignment
                if (!tail || ((isarr = (Array.isArray(tail) || isObservableArray(tail))) && tail.length === 0)) {
                    return acc
                }

                if (isarr) {
                    @observer
                    class ArrayComponent extends React.Component<{}, any> {
                        render() {
                            const children = tail.map((x, k) => {
                                return (node[INodeIndex.Children] as any).map(d => {
                                    return traverse(null, d, x, k)
                                })
                            })
                            return <div>{children}</div>
                        }
                    }

                    acc.push(<ArrayComponent />)
                } else {
                    /* TODO */
                    acc.push(<i />)

                }
            } else if (node[INodeIndex.Kind] === IStacheNodeKind.Variable) {
                @observer
                class VariableTextComponent extends React.Component<{}, any> {
                    render() {
                        let key

                        if (typeof ix === "number") {
                            key = ix
                        } else {
                            key = node[INodeIndex.Reference]
                        }

                        const val = top[key]

                        return <span>{val}</span>
                    }
                }

                acc.push(<VariableTextComponent />)
            }

            return acc
        }

        const tree = traverse(null, this.root, state)

        return tree
    }
}
