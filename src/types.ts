export enum ITokenKind {
    Open = 1, Close, Text, Variable, SectionOpen, SectionClose
}

export type IToken = [ ITokenKind, string, { [s: string]: any } | null ]
