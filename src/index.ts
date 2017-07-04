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

function createObserverComponent(options: XusOptions<any>, props: ObserverComponentProps) {
    const {
        React
    } = options

    const {
        parseTree,
        traverseFn,
        state
    } = props

    let actualProps = parseTree[ParseTreeIndex.Attrs] as { [s: string]: any } | null

    if (typeof actualProps === "object") {
        actualProps = actualProps.attributes
    }

    return React.createElement(
        parseTree[ParseTreeIndex.Tag] as any,
        actualProps,
        (parseTree[ParseTreeIndex.Children] as (ParseTree | string)[])
            .reduce<React.ReactNode>((acc: (React.ReactNode | string)[], childTree: (ParseTree | string)) => {
                return traverseFn(acc, childTree, [ state ])
            }, [])
    )
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
                ...{
                    parseTree: props.parseTree,
                    traverseFn: props.traverseFn,
                    state: props.state[props.state.length - 1]
                },
                ...props.attributes
            },
            children)
    }
}
