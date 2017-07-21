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

const syntheticEvents = [
    "onTransitionEnd",
    "onAnimationStart",
    "onAnimationEnd",
    "onAnimationIteration",
    "onLoad",
    "onError",
    "onAbort",
    "onCanPlay",
    "onCanPlayThrough",
    "onDurationChange",
    "onEmptied",
    "onEncrypted",
    "onEnded",
    "onError",
    "onLoadedData",
    "onLoadedMetadata",
    "onLoadStart",
    "onPause",
    "onPlay",
    "onPlaying",
    "onProgress",
    "onRateChange",
    "onSeeked",
    "onSeeking",
    "onStalled",
    "onSuspend",
    "onTimeUpdate",
    "onVolumeChange",
    "onWaiting",
    "onWheel",
    "onScroll",
    "onTouchCancel",
    "onTouchEnd",
    "onTouchMove",
    "onTouchStart",
    "onSelect",
    "onClick",
    "onContextMenu",
    "onDoubleClick",
    "onDrag",
    "onDragEnd",
    "onDragEnter",
    "onDragExit",
    "onDragLeave",
    "onDragOver",
    "onDragStart",
    "onDrop",
    "onMouseDown",
    "onMouseEnter",
    "onMouseLeave",
    "onMouseMove",
    "onMouseOut",
    "onMouseOver",
    "onMouseUp",
    "onChange",
    "onInput",
    "onSubmit",
    "onFocus",
    "onBlur",
    "onKeyDown",
    "onKeyPress",
    "onKeyUp",
    "onCompositionEnd",
    "onCompositionStart",
    "onCompositionUpdate",
    "onCopy",
    "onCut",
    "onPaste"
]

const lowerCaseSyntheticEvents =
    syntheticEvents.map(d => d.toLowerCase())

/**
 * A `TemplateContext` is a `Function` that has a local value of a [[ParseTree]].
 *
 * It will either instantiate a new [[Template]] or use the provided one in `ctor` parameter, and call
 * [[Template.render]] method with this value.
 */
export type TemplateContext<U> = (state: any, options: RenderOptions<U>, ctor?: TemplateConstructor<U>) => U[]

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
    1: ({ [s: string]: ParseTree[] } | null) /* props */ | string /* node ref (section/variable names) */
    2?: ParseTree[] /* children */
    3?: ParseTree /* parent */
}

export interface VisitorOptions<U> {
    attributes?: { [s: string]: any } | null
    parseTree?: ParseTree
    traverseChildren?: (children: (U | string)[] | null, node: ParseTree | string, top?: any[]) => U[]
    state?: any
}

/**
 * An `ObserverFactory` is a `Function` that turns a `ReactComponent` into a reactive `ReactComponent`,
 * an example implementation on top of `mobx` is `mobx-react`.
 */
export type ObserverFactory<P> = /* TODO: send a pr to mobx-react for these factory types */
    (componentClass: React.ComponentClass<P> | React.StatelessComponent<P>) => React.ReactElement<P>

export interface RenderOptions<P> {
    createElement: React.Factory<P>
    registry?: { [s: string]: any }
    observer: ObserverFactory<P>
}

export interface TemplateOptions<U> {
    visitNode: (type: string, options: VisitorOptions<U>, children: U[]) => U
}

export interface TemplateInterface<U> {
    root: ParseTree
    options?: TemplateOptions<U>
    render: (state: any, options: TemplateOptions<U>) => U[]
}

/**
 * @hidden
 */
export interface TemplateConstructor<U> {
    new (options: TemplateOptions<U>): TemplateInterface<U>
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

    options?: TemplateOptions<U>

    constructor(options?: TemplateOptions<U>) {
        this.options = options
    }

    render(state: any, options?: TemplateOptions<U>): U[] {
        this.options = { ...this.options, ...options }
        return this.traverse(null, this.root, [ state ])
    }

    protected traverse: (children: (U | string)[] | null, node: ParseTree | string, top?: any[]) => U[] = (children, node, top?) => {
        const {
            visitNode
        } = this.options

        if (!Array.isArray(node)) {
            if (!children) {
                throw new Error("top-level text :" + node)
            }
            children.push(node)
        } else if ("string" === typeof node[ParseTreeIndex.Tag]) {
            let right: any[] = []
            this._reduceTree(node, top, right)

            let propAttrs = node[ParseTreeIndex.Attrs]

            let element: any
            const tag = node[ParseTreeIndex.Tag]
            const visitorOptions = {
                ...this._formatAttributes(propAttrs as { [s: string]: any }),
                ...{
                    parseTree: node,
                    state: top,
                    traverseChildren: this.traverse
                }
            }

            if ("function" === typeof visitNode) {
                element = visitNode(tag as string, visitorOptions, right)
            } else {
                element = { tag, props: propAttrs, children: right } // XXX:
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
        if ((typeof attrs === "object" && attrs !== null) && Object.keys(attrs).length) {
            return { attributes: attrs }
        }
        return {}
    }
}

/**
 * Builds a `ReactElement`.
 *
 * Normalizes property names for React and ensures that we have a valid `ReactElement`.
 *
 * @param options
 * @param visitorOptions
 */
function visitObserver<T>(options: RenderOptions<T>, visitorOptions: VisitorOptions<React.ReactElement<T>>): React.ReactElement<T> {
    const { createElement } = options
    const { parseTree, traverseChildren, state } = visitorOptions

    let type = parseTree[ParseTreeIndex.Tag] as any

    if (options.registry && options.registry.hasOwnProperty(type)) {
        type = options.registry[type]
    }

    let children: React.ReactNode[] = null

    let visitChildren = (selfClosingTags.indexOf(type) === -1)

    let attrs = visitorOptions.attributes

    if (attrs === null || typeof attrs !== "object") {
        attrs = {}
    }

    let newAttrs = attrs as any

    Object.keys(attrs).forEach(propKey => {
        const tpl = new Template<{ [s: string]: any }>({
            visitNode: (propType, propOptions, propChildren) => {
                const propParseTree = propOptions.parseTree
                const traverseFn = propOptions.traverseChildren
                const newPropChildren = (propParseTree[ParseTreeIndex.Children] as (ParseTree | string)[])
                    .reduce<{ [s: string]: any }[]>((acc: ({ [s: string]: any } | string)[], childTree: (ParseTree | string)) => {
                        return traverseFn(acc, childTree, [ state ])
                    }, [])

                let propValue = newPropChildren.join("") as any

                if (propValue.length) {
                    if (state.hasOwnProperty(propValue) && typeof state[propValue] === "function") {
                        propValue = state[propValue]
                    }
                    return {
                        [propKey]: propValue
                    }
                } else {
                    return {
                        [propKey]: null
                    }
                }
            }
        })
        tpl.root = [ "root", null, attrs[propKey] ]
        newAttrs = { ...newAttrs, ...tpl.render(state) }
    })

    const normalizedProps = Object.keys(newAttrs).reduce((acc: any, key) => {
        let value: any = newAttrs[key]

        if (typeof type === "string" && (type === "input" || type === "textarea")) {
            if (newAttrs.hasOwnProperty("checked")) {
                acc.defaultChecked = newAttrs.checked
            }
            if (newAttrs.hasOwnProperty("value")) {
                acc.defaultValue = newAttrs.value
                if (type === "textarea") {
                    visitChildren = false
                }
            }
        }

        if (key === "class") {
            acc.className = value
        } else if (key === "for") {
            acc.htmlFor = value
        } else {
            const eventNameIndex = lowerCaseSyntheticEvents.indexOf(key)
            if (eventNameIndex !== -1) {
                acc[syntheticEvents[eventNameIndex]] = value
            } else {
                acc[key] = value
            }
        }

        return acc
    }, {}) as { [s: string]: any }

    if (visitChildren) {
        children = (parseTree[ParseTreeIndex.Children] as (ParseTree | string)[])
            .reduce<React.ReactElement<any>[]>((acc: (React.ReactElement<any>)[], childTree: (ParseTree | string)) => {
                return traverseChildren(acc, childTree, [ state ])
            }, [])
    }

    return createElement(
        type,
        typeof type === "function"
            ? { state, ...normalizedProps } /* state is passed as 'state' prop to custom components only */
            : normalizedProps,
        children)
}

/**
 * Renders a [[TemplateContext]] into a `ReactElement`.
 *
 * If a tag name doesn't resolve to a `ComponentClass` in the provided `options.registry`, xūs will
 * by default assume it is an ordinary HTML tag and wrap it in `observer`. If a `ComponentClass`
 * is found instead, then it's up to the provider to make this an observer, or not.
 *
 * @param ctx  A [[TemplateContext]] created with [[compile]].
 * @param state
 * @param options
 */
export function render<P>(ctx: TemplateContext<React.ReactElement<P>>, state: { [s: string]: any }, options: RenderOptions<P>): React.ReactElement<P> {
    if (!options ||
        (typeof options === "object") &&
        (!options.hasOwnProperty("createElement") || !options.hasOwnProperty("observer"))) {
        throw new Error("you must provide 'createElement' and 'observer'")
    }

    const { createElement, observer } = options

    const registry = {
        ObserverComponent: observer(visitObserver.bind(null, options))
    }

    if (options.registry) {
        Object.keys(options.registry).forEach(type => {
            registry[type] = visitObserver.bind(null, options)
        })
    }

    const element = ctx.call(new Template, state, {
        ...{
            registry: registry,
            visitNode: _visitNode
        } as TemplateOptions<any>,
        ...options
    })

    function _visitNode(
        type: string,
        // tslint:disable-next-line:no-shadowed-variable
        options: VisitorOptions<React.ReactElement<any>>,
        children: (React.ReactNode | string)[]) {

        const factory = registry.hasOwnProperty(type)
            ? registry[type]
            : registry.ObserverComponent

        return createElement(
            factory,
            {
                ...options,
                ...{
                    state: options.state[options.state.length - 1]
                }
            },
            children)
    }

    return element
}

function isArray(value: any) {
    return Array.isArray(value) || isObservableArray(value)
}

/**
 * Poor man's `isObservableArray`.
 *
 * @param value
 */
function isObservableArray(value: any) {
    return isObject(value) &&
        (value.hasOwnProperty("$mobx") &&
         typeof value["$mobx"].constructor === "function" &&
         value["$mobx"].constructor.name === "ObservableArrayAdministration") /* XXX: watch out for this one */
}

function isObject(value: any): boolean {
    return value !== null && typeof value === "object"
}

function isBoolean(value: any): boolean {
    const valueType = typeof(value)
    return (valueType === "undefined" || valueType === "boolean" || (valueType === "object" && value === null))
}
