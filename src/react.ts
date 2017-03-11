import {ICommonAttrs} from "./types"
import * as React from "react"
import transform = require("./transform")
import {Template} from "./runtime"
import {classIdSplit, notClassId} from "./util"
const fromString = require("from2-string")
const pumpify = require("pumpify")
const split = require("browser-split")

export class ReactVText {
    isEmptyText?: boolean = false

    constructor(text: string) {
        if (text.match(/^[\s\xa0]+$/g)) { // XXX: by default we collapse everything
            this.isEmptyText = true
            return null
        }
        return reactH("span", {}, text)
    }
}

export class ReactVNode {
    constructor(tag: string, attrs: ICommonAttrs = {}, children: (ReactVNode | ReactVText)[]) {
        return reactH(tag, attrs.attributes || {}, children)
    }
}

export type IbuildReactCallback = (er: Error, res?: React.ReactElement<any>) => void

export function buildReact(html: string, state: any, cb: IbuildReactCallback) {
    const stream = pumpify.obj(fromString(html), transform.pack())

    stream.on("data", render => {
        if (typeof cb === "function") {
            const res = render.call(new Template, state, { VNodeClass: ReactVNode, VTextClass: ReactVText } )
            cb(null, res)
        }
    })

    stream.on("error", er => {
        if (typeof cb === "function") {
            cb(er)
        }
    })
}

function reactH(tagName: string, props: ICommonAttrs = {}, children: any): React.ReactElement<any> {
    tagName = parseTag(tagName, props)

    const fn = React.DOM[tagName]
    if (typeof fn !== "function") {
        throw new Error(`"${tagName}" is not a valid React.DOM tag`)
    }

    let args = [ props ]

    if (isChildren(children)) {
        if (Array.isArray(children)) { // prevent empty text from being included
            children = children.filter(d => !d.isEmptyText)
        }
        args = args.concat(children)
    }

    return fn.apply(null, args)
}

function isChildren(x) {
    return typeof x === "string" || typeof x === "number" || Array.isArray(x) || React.isValidElement(x)
}

function parseTag(tag: string, props: ICommonAttrs) {
    const noId = !(props.hasOwnProperty("id"))

    const tagParts = split(tag, classIdSplit)
    let tagName = null

    if (notClassId.test(tagParts[1])) {
        tagName = "div"
    }

    let classes, part, type, i

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i]

        if (!part) {
            continue
        }

        type = part.charAt(0)

        if (!tagName) {
            tagName = part
        } else if (type === ".") {
            classes = classes || []
            classes.push(part.substring(1, part.length))
        } else if (type === "#" && noId) {
            props.id = part.substring(1, part.length)
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className)
        }
        props.className = classes.join(" ")
    }

    return tagName
}
