import { ParseTree, ParseTreeIndex, Template, TemplateOptions, VirtualTreeProps } from "./runtime"
import { toRenderFunction } from "./transform"

export * from "./compiler"
export * from "./lexer"
export * from "./runtime"
export * from "./transform"

export type XusOptions<T> = {
    React: any
    mobxReact: any
    mobx: any
    registry?: { [s: string]: T },
    createElement?: (type: string, props: VirtualTreeProps<T>, children: T[]) => T
}

export type ObserverComponentProps = {
    state: any
    attributes?: VirtualTreeProps<React.ReactNode>
    parseTree: ParseTree
    traverseFn?: (children: (React.ReactNode | string)[] | null, node: ParseTree | string, top?: any[]) => React.ReactNode[]
}

const selfClosingTags = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "keygen",
    "link",
    "menuitem", // see: https://github.com/facebook/react/blob/85dcbf83/src/renderers/dom/shared/ReactDOMComponent.js#L437
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]

function createObserverComponent(options: XusOptions<any>, props: ObserverComponentProps) {
    const { React } = options
    const { parseTree, traverseFn, state } = props

    const type = parseTree[ParseTreeIndex.Tag] as any

    let children: React.ReactNode[] = null

    let visitChildren = (selfClosingTags.indexOf(type) === -1)

    let attrs = parseTree[ParseTreeIndex.Attrs] as { [s: string]: any } | null

    if (attrs === null || typeof attrs !== "object") {
        attrs = {}
    }

    const normalizedProps = Object.keys(attrs).reduce((acc: any, key) => {
        key = key.toLowerCase()

        let value: any = attrs[key]

        if (typeof type === "string" && (type === "input" || type === "textarea")) {
            if (attrs.hasOwnProperty("checked")) {
                acc.defaultChecked = attrs.checked
            }
            if (attrs.hasOwnProperty("value")) {
                acc.defaultValue = attrs.value
                if (type === "textarea") {
                    visitChildren = false
                }
            }
        }

        if (key === "class") {
            acc.className = value
        } else if (key === "for") {
            acc.htmlFor = value
        }

        return acc
    }, {}) as any


    if (visitChildren) {
        children = (parseTree[ParseTreeIndex.Children] as (ParseTree | string)[])
            .reduce<React.ReactNode[]>((acc: (React.ReactNode | string)[], childTree: (ParseTree | string)) => {
                return traverseFn(acc, childTree, [ state ])
            }, [])
    }







    // if (attrs.dataset) {

    // }

    // if (properties.dataset) {
    //     Object.keys(properties.dataset).forEach(function unnest(attrName) {
    //     var dashedAttr = attrName.replace(/([a-z])([A-Z])/, function dash(match) {
    //         return match[0] + '-' + match[1].toLowerCase();
    //     });
    //     properties['data-' + dashedAttr] = properties.dataset[attrName];
    //     });
    // }

    return React.createElement(type, normalizedProps, children)
}

export function xus<T>(html: string, state: any, options: XusOptions<T>, cb: (buildError, node?: T, html?: string) => void) {
    if (!options ||
        (typeof options === "object") &&
        (!options.hasOwnProperty("React") ||
         !options.hasOwnProperty("mobxReact") ||
         !options.hasOwnProperty("mobx"))) {
        throw new Error("you must provide React, mobx and mobxReact")
    }

    const {
        React,
        mobx,
        mobxReact
    } = options

    const registry = {
        ObserverComponent: mobxReact.observer(createObserverComponent.bind(null, options))
    }

    toRenderFunction(html, (transformError, render?) => {
        if (transformError) {
            return cb(transformError)
        }
        const element = render.call(new Template, state, {
            ...{
                registry: {
                    ...registry,
                    ...options.registry
                },
                createElement: createElement
            },
            ...options
        })
        cb(null, element, html)
    })

    function createElement(
        type: React.ComponentClass | string,
        props: VirtualTreeProps<React.ReactNode>,
        children: (React.ReactNode | string)[]) {

        return React.createElement(
            registry.ObserverComponent,
            {
                parseTree: props.parseTree,
                traverseFn: props.traverseFn,
                state: props.state[props.state.length - 1]
            },
            children)
    }
}
