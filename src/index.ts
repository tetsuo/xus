import * as mobx from "mobx"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as registry from "./registry"
import { ParseTree, Template, VirtualTreeProps } from "./runtime"
import { toRenderFunction } from "./transform"

export function xus(html: string, state: any, options: any, cb: (buildError, node?, html?: string) => void) {
    toRenderFunction(html, (transformError, render?) => {
        if (transformError) {
            return cb(transformError)
        }
        const element = render.call(new Template, state, {
            ...{
                registry: registry,
                createElement: createElement
            },
            ...options
        })
        cb(null, element, html)
    })
}

for (const key in mobx) {
    (xus as any)[key] = mobx[key]
}

(xus as any).render = ReactDOM.render

function createElement(
    type: React.ComponentClass | string,
    props: VirtualTreeProps<React.ReactNode>,
    children: (React.ReactNode | string)[]) {

    return React.createElement(
        registry.ObserverComponent,
        {
            ...{
                parseTree: props.parseTree,
                traverseFn: props.traverseFn,
                state: props.state[props.state.length - 1]
            },
            ...props.attributes
        },
        children)
}
