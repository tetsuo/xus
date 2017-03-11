import {ITokenKind} from "./types"

export const stacheSplitter = /({[^}]+})/
export const stacheMatcher = /^{\s*([#\/]?)(\w+)\s*}$/

export const KindByTagSymbol = {
  "" : ITokenKind.Variable,
  "#": ITokenKind.SectionOpen,
  "/": ITokenKind.SectionClose
}

export const classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/
export const notClassId = /^\.|#/
