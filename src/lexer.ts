import through = require("through2")
import { Parser } from "htmlparser2"
const duplexify = require("duplexify")

export enum LexerTokenKind {
    Open = 1,
    Close = 2,
    Text = 3,
    Variable = 4,
    SectionOpen = 5,
    SectionClose = 6,
    InvertedSectionOpen = 7,
    Comment = 8
}

export interface LexerToken extends Array<any> {
  0: LexerTokenKind | string /* string could be a text node, or a section/variable reference */
  1: string /* value */
  2?: { [s: string]: any } /* attrs */
}

export enum LexerTokenIndex {
  Kind = 0, TextNode = 0, VariableName = 0, SectionName = 0,
  Body = 1,
  Attrs = 2
}

const defaultSymbolMap = {
  "" : LexerTokenKind.Variable,
  "#": LexerTokenKind.SectionOpen,
  "/": LexerTokenKind.SectionClose,
  "^": LexerTokenKind.InvertedSectionOpen,
  "!": LexerTokenKind.Comment
}

/**
 * Given a a xūs template as input, will produce rows of [[LexerToken]]s.
 *
 * @param options  Override the symbol map and default matchers.
 */
export function tokenize(): NodeJS.ReadWriteStream {
    const tr = through.obj()

    function pushToken(kind: LexerTokenKind, value: string, attrs?: { [s: string]: any }) {
        const token: LexerToken = [ kind, value ]
        if (attrs) {
            token.push(attrs)
        }

        if (kind === LexerTokenKind.Text) {
            scan(value, function(er, scanKind, body) {
                if (er) {
                    return void tr.emit(er.message)
                }
                tr.push([ scanKind, body ])
            })
        } else if (kind === LexerTokenKind.Open) {
            const attrTrees = {} as any

            Object.keys(attrs).forEach(attrKey => {
                const attrTree = []
                scan(attrs[attrKey], function(er, scanKind, body) {
                    if (er) {
                        return void tr.emit(er.message)
                    }

                    attrTree.push([ scanKind, body ])
                })

                attrTrees[attrKey] = attrTree
            })

            token[LexerTokenIndex.Attrs] = attrTrees
            tr.push(token)

        } else {
            tr.push(token)
        }
    }

    const parser = new Parser({
        onopentag: function pushOpen(name, attrs) {
            pushToken(LexerTokenKind.Open, name, attrs)
        },
        onclosetag: function pushClose(value) {
            pushToken(LexerTokenKind.Close, value)
        },
        ontext: function pushText(value) {
            pushToken(LexerTokenKind.Text, value)
        }
    }, {
        xmlMode: false, /* case-insensitive */
        recognizeSelfClosing: true
    })

    return duplexify.obj(parser, tr)
}

/**
 * Scan a string for stache tags and emit tokens.
 *
 * @param s   Text to be scanned.
 * @param cb  Callback will be called for each seen tag.
 */
function scan(s: string, cb: (er: Error|null, kind?: LexerTokenKind, body?: string) => void): void {
  let i = -1
  let text = ""
  let match: RegExpMatchArray
  let token: string
  let tokens = s.split(/({[^}]+})/)

  while (++i < tokens.length) {
    token = tokens[i]

    if (0 !== i % 2) {
      free()

      match = token.match(/^{\s*([#\/\^\!]?)([\s\S]+)s*}$/)

      if (!match) {
        return void cb(new Error(`scan error: ${token}`))
      }

      let type = (defaultSymbolMap)[match[1]]
      let data = match[2] as RegExpMatchArray | string

      if (type !== LexerTokenKind.Comment) {
          data = (data as string).match(/^\s*(\w+)\s*$/)
          if (!data) {
              return void cb(new Error(`could not determine key name: ${token}`))
          } else {
              data = data[1]
          }
      }

      cb(null, type, data as string)
    } else {
      text += token
    }
  }

  function free() {
    if (text.length) {
      cb(null, LexerTokenKind.Text, text)
      text = ""
    }
  }

  free()
}
