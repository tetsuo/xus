import {ITokenKind} from "./types"

export const stacheSplitter = /({[^}]+})/
export const stacheMatcher = /^{\s*([#\/]?)(\w+)\s*}$/

export const KindByTagSymbol = {
  "" : ITokenKind.Variable,
  "#": ITokenKind.SectionOpen,
  "/": ITokenKind.SectionClose
}
