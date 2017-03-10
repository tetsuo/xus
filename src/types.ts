export type ITokenTupleValue = ITokenKind | string | ICommonAttrs

export enum ITokenKind {
    Open = 1,
    Close,
    Text,
    Variable,
    SectionOpen,
    SectionClose
}

export enum ITokenIndex {
    Kind = 0, TextNode = 0, VariableReference = 0, SectionReference = 0,
    Body = 1,
    Attrs = 2
}

export type IVariableReference = string

export type ISectionReference = string

export interface IToken extends Array<ITokenTupleValue> {
  0:  ITokenKind | ITextNode | IVariableReference | ISectionReference,
  1:  string,
  2?: ICommonAttrs
}

export type INodeTupleValue = INodeKind | ICommonAttrs | INode

export enum INodeIndex {
    Kind = 0, Tag = 0,
    Attrs = 1, Reference = 1,
    Children = 2,
    Parent = 3
}

export enum IStacheNodeKind {
    Section = 2,
    Variable
}

export type INodeKind = IStacheNodeKind | INodeTag

export type INodeTag = string

export type IStacheNodeReference = IVariableReference | ISectionReference

export type ITextNode = string

export interface INode extends Array<INodeTupleValue> {
  0:  INodeTag | INodeKind,
  1:  ICommonAttrs | IStacheNodeReference
  2?: INode[]
  3?: INode
}

export type ICommonAttrs = {
    [ s: string ]: any
} | null
