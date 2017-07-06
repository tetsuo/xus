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

/**
 * A `TemplateContext` is a `Function` that has a local value of a [[ParseTree]].
 *
 * It will either instantiate a new [[Template]] or use the provided one in `ctor` parameter, and call
 * [[Template.render]] method with this value.
 */
export type TemplateContext<U> = (state: any, options: BaseRenderOptions<U>, ctor?: TemplateConstructor<U>) => U[]

export enum ParseTreeKind {
    Section = 2,
    Variable
}

export enum ParseTreeIndex {
    Kind = 0, Tag = 0,
    Attrs = 1, Variable = 1,
    Children = 2,
    Parent = 3
}

export interface ParseTree extends Array<any> {
    0: ParseTreeKind | string /* tag name */
    1: ({ [s: string]: any } | null) | string /* node ref (section/variable names) */
    2?: ParseTree[] /* children */
    3?: ParseTree /* parent */
}

export interface CreateElementOptions<U> {
    attributes?: { [s: string]: any } | null
    parseTree?: ParseTree
    visitor?: (children: (U | string)[] | null, node: ParseTree | string, top?: any[]) => U[]
    state?: any
}

export interface BaseRenderOptions<U> {
    createElement?: (type: string, options: CreateElementOptions<U>, children: U[]) => U
}

export interface RenderOptions extends BaseRenderOptions<React.ReactNode> {
    registry?: { [s: string]: any }
    React: any
    mobxReact: any
}

export interface TemplateInterface<U> {
    root: ParseTree
    options?: BaseRenderOptions<U>
    render: (state: any, options: BaseRenderOptions<U>) => U[]
}

/**
 * @hidden
 */
export interface TemplateConstructor<U> {
    new (options: BaseRenderOptions<U>): TemplateInterface<U>
}

/**
 * Template is the runtime interpreter for [[ParseTree]]s.
 *
 * It exposes a single [[Template.render]] method which, when called, will call the provided
 * `createElement` method for the each tag it sees as it traverses the parse-tree (which is initially
 * set in its `root` property).
 *
 * @typeparam U  A generic type for the returned values from `options.createElement`.
 */
export class Template<U> implements TemplateInterface<U> {
    root: ParseTree

    options?: BaseRenderOptions<U>

    constructor(options?: BaseRenderOptions<U>) {
        this.options = options
    }

    render(state: any, options: BaseRenderOptions<U>): U[] {
        this.options = { ...this.options, ...options }
        return this.traverse(null, this.root, [ state ])
    }

    protected traverse: (children: (U | string)[] | null, node: ParseTree | string, top?: any[]) => U[] = (children, node, top?) => {
        const {
            createElement
        } = this.options

        if (!Array.isArray(node)) {
            if (!children) {
                throw new Error("top-level text :" + node)
            }
            children.push(node)
        } else if ("string" === typeof node[ParseTreeIndex.Tag]) {
            let right: any[] = []
            this._reduceTree(node, top, right)

            let element: any
            const tag = node[ParseTreeIndex.Tag] as string
            const props = {
                ...this._formatAttributes(node[ParseTreeIndex.Attrs] as { [s: string]: any }),
                ...{
                    parseTree: node,
                    state: top,
                    visitor: this.traverse
                }
            }

            if ("function" === typeof createElement) {
                element = createElement(tag, props, right)
            } else {
                element = { tag, props, children: right }
            }

            if (!children) {
                return element
            } else {
                children.push(element)
            }
        } else if (node[ParseTreeIndex.Kind] === ParseTreeKind.Section) {
            const tail = top[top.length - 1]
            const value = tail[node[ParseTreeIndex.Variable] as string]

            if (isBoolean(value)) {
                if (!value) {
                    return children
                }
                top.push(tail)
                this._reduceTree(node, top, children)
                top.pop()
            } else if (isArray(value)) {
                if (value.length === 0) {
                    return children
                }
                top.push(value)
                value.forEach((item) => {
                    top.push(item)
                    this._reduceTree(node, top, children)
                    top.pop()
                })
                top.pop()
            } else if (isObject(value)) {
                top.push(value)
                this._reduceTree(node, top, children)
                top.pop()
            } else {
                throw new Error("could not determine section type")
            }
        } else if (node[ParseTreeIndex.Kind] === ParseTreeKind.Variable) {
            children.push(top[top.length - 1][node[ParseTreeIndex.Variable] as string])
        }

        return children
    }

    private _reduceTree = (node: ParseTree | string, top: any[], children: (U | string)[]) => {
        (node[ParseTreeIndex.Children] as ParseTree[])
            .reduce((acc, child) => {
                return this.traverse(acc, child, top)
            }, children)
    }

    private _formatAttributes(attrs: { [s: string]: any }): { attributes?: { [s: string]: any }} {
        if (Object.keys(attrs).length) {
            return { attributes: attrs }
        }
        return {}
    }
}

function buildElement(options: RenderOptions, internalOptions: CreateElementOptions<React.ReactNode>): React.ReactElement<any> {
    const { React } = options
    const { parseTree, visitor, state } = internalOptions

    let type = parseTree[ParseTreeIndex.Tag] as any

    if (options.registry && options.registry.hasOwnProperty(type)) {
        type = options.registry[type]
    }

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
                return visitor(acc, childTree, [ state ])
            }, [])
    }

    return React.createElement(type, normalizedProps, children)
}

/**
 * Renders a [[TemplateContext]] into a `ReactNode`.
 *
 * If a tag name doesn't resolve to a `React.ComponentClass` in the provided `options.registry`, xūs will
 * by default assume it is an ordinary HTML tag and wrap it in `mobxReact.observer`. If a `ComponentClass`
 * is found instead, then it is up to the provider to wrap it up with `mobxReact`, or not.
 *
 * @param ctx  A [[TemplateContext]] created with [[compile]].
 * @param state  An object created with `mobx.observable`.
 * @param options
 */
export function render(ctx: TemplateContext<React.ReactNode>, state: any, options: RenderOptions): React.ReactNode {
    if (!options ||
        (typeof options === "object") &&
        (!options.hasOwnProperty("React") ||
        !options.hasOwnProperty("mobxReact"))) {
        throw new Error("you must provide React and mobxReact")
    }

    const {
        React,
        mobxReact
    } = options

    const registry = {
        ObserverComponent: mobxReact.observer(buildElement.bind(null, options))
    }

    if (options.registry) {
        Object.keys(options.registry).forEach(type => {
            registry[type] = buildElement.bind(null, options)
        })
    }

    const element = ctx.call(new Template, state, {
        ...{
            registry: registry,
            createElement: createElement
        },
        ...options
    })

    function createElement(
        type: string,
        // tslint:disable-next-line:no-shadowed-variable
        options: CreateElementOptions<React.ReactNode>,
        children: (React.ReactNode | string)[]) {

        const factory = registry.hasOwnProperty(type)
            ? registry[type]
            : registry.ObserverComponent

        return React.createElement(
            factory,
            {
                parseTree: options.parseTree,
                visitor: options.visitor,
                state: options.state[options.state.length - 1]
            },
            children)
    }

    return element
}

function isArray(value: any) {
    return Array.isArray(value) || isObservableArray(value)
}

function isObservableArray(value: any) { // poor man's isObservableArray
    return isObject(value) &&
        (value.hasOwnProperty("$mobx") &&
         typeof value["$mobx"].constructor === "function" &&
         value["$mobx"].constructor.name === "ObservableArrayAdministration") // XXX: watch out for this one
}

function isObject(value: any): boolean {
    return value !== null && typeof value === "object"
}

function isBoolean(value: any): boolean {
    const valueType = typeof(value)
    return (valueType === "undefined" || valueType === "boolean" || (valueType === "object" && value === null))
}
