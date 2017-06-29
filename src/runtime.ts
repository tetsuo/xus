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

export type ParseTree = {
    0: ParseTreeKind | string /* tag name */
    1: ({ [s: string]: any } | null) | string /* stache node reference (section/variable names) */
    2?: ParseTree[] /* children */
    3?: ParseTree /* parent */
} & any[]

export type VirtualTreeProps<T> = {
    attributes?: { [s: string]: any } | null
    parseTree?: ParseTree
    traverseFn?: (children: (T | string)[] | null, node: ParseTree | string, top?: any[]) => T[]
    state?: any
}

export type TemplateOptions<T> = {
    registry: { [s: string]: T },
    createElement: (type: string, props: VirtualTreeProps<T>, children: T[]) => T
}

export interface TemplateInterface<T> {
    root: ParseTree
    options?: TemplateOptions<T>
    render(state: any, options: TemplateOptions<T>): T
}

export interface TemplateConstructor<T> {
    new (options: TemplateOptions<T>): TemplateInterface<T>
}

export enum TemplateSectionKind {
    ConditionalSection = 1,
    ArraySection = 2,
    ObjectSection = 3
}

export class Template<T> implements TemplateInterface<T> {
    root: ParseTree

    options?: TemplateOptions<T>

    constructor(options?: TemplateOptions<T>) {
        this.options = options
    }

    render(state: any = {}, options: TemplateOptions<T>) {
        this.options = { ...this.options, ...options }
        return this.traverse(null, this.root, [state])
    }

    protected traverse = (children: (T | string)[] | null, node: ParseTree | string, top?: any[]) => {
        const {
            createElement
        } = this.options

        if (!Array.isArray(node)) {
            if (!children) {
                throw new Error("top-level text :" + node)
            }
            children.push(node)
        } else if ("string" === typeof node[ParseTreeIndex.Tag]) {
            // debugger
            let right: any[] = []
            // debugger
            this._reduceTree(node, top, right)
            // debugger

            let element: any
            const tag = node[ParseTreeIndex.Tag] as string
            const props = {
                ...this._formatAttributes(node[ParseTreeIndex.Attrs] as { [s: string]: any }),
                ...{
                    parseTree: node,
                    state: top,
                    traverseFn: this.traverse
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

    private _reduceTree = (node: ParseTree | string, top: any[], children: (T | string)[]) => {
        (node[ParseTreeIndex.Children] as ParseTree[])
            .reduce((acc, child) => {
                return this.traverse(acc, child, top)
            }, children)
    }

    private _formatAttributes(attrs: { [s: string]: any }): VirtualTreeProps<T> {
        if (Object.keys(attrs).length) {
            return { attributes: attrs }
        }
        return {}
    }
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
