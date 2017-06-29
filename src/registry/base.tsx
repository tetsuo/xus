import { observer } from "mobx-react"
import * as React from "react"
import { ParseTree, ParseTreeIndex, VirtualTreeProps } from "../runtime"

export type BaseComponentProps = {
    state: any
    attributes?: VirtualTreeProps<React.ReactNode>
    parseTree: ParseTree
    traverseFn?: (children: (React.ReactNode | string)[] | null, node: ParseTree | string, top?: any[]) => React.ReactNode[]
}

@observer
export class BaseComponent<T extends BaseComponentProps> extends React.Component<T, any> {
    render() {
        const {
            parseTree
        } = this.props

        let actualProps = parseTree[ParseTreeIndex.Attrs] as { [s: string]: any } | null

        if (typeof actualProps === "object") {
            actualProps = actualProps.attributes
        }

        return React.createElement(
            parseTree[ParseTreeIndex.Tag] as any,
            actualProps,
            (parseTree[ParseTreeIndex.Children] as (ParseTree | string)[])
                .reduce<React.ReactNode>(this.walk, [])
        )
    }

    walk = (acc: (React.ReactNode| string)[], childTree: (ParseTree | string)) => {
        const {
            traverseFn,
            state
        } = this.props
        return traverseFn(acc, childTree, [ state ])
    }
}
