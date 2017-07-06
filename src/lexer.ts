import through = require("through2")
import { Parser } from "htmlparser2"
const duplexify = require("duplexify")

export enum LexerTokenKind {
    Open = 1,
    Close,
    Text,
    Variable,
    SectionOpen,
    SectionClose
}

export interface LexerToken extends Array<any> {
  0: LexerTokenKind | string /* string could be a text node, or a section/variable reference */
  1: string /* value */
  2?: { [s: string]: any } /* attrs */
}

export enum LexerTokenIndex {
  Kind = 0, TextNode = 0, VariableVariable = 0, SectionVariable = 0,
  Body = 1,
  Attrs = 2
}

export interface LexerOptions {
  matcher?: RegExp
  splitter?: RegExp
  symbolMap?: { [s: string]: LexerTokenKind }
}

const defaultSplitter = /({[^}]+})/
const defaultMatcher = /^{\s*([#\/]?)(\w+)\s*}$/
const defaultSymbolMap = {
  "" : LexerTokenKind.Variable,
  "#": LexerTokenKind.SectionOpen,
  "/": LexerTokenKind.SectionClose
}

/**
 * Given a a xūs template as input, will produce rows of [[LexerToken]]s.
 *
 *   `function render (state, options, constructor)`
 *
 * @param options  Override the symbol map and the default matchers.
 */
export function tokenize(options?: LexerOptions): NodeJS.ReadWriteStream {
    const tr = through.obj()

    function pushToken(kind: LexerTokenKind, value: string, attrs?: { [s: string]: any }) {
        const token: LexerToken = [ kind, value ]
        if (attrs) {
            token.push(attrs)
        }

        if (kind === LexerTokenKind.Text) {
            scan(value, options, function scan(er, scanKind, body) {
                if (er) {
                    return void tr.emit(er.message)
                }
                tr.push([ scanKind, body ])
            })
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
    })

    return duplexify.obj(parser, tr)
}

/**
 * Scan a string for stache tags and emit tokens.
 *
 * @param s   Text to be scanned.
 * @param cb  Callback will be called for each seen tag.
 */
function scan(s: string, opts: LexerOptions = {}, cb: (er: Error|null, kind?: LexerTokenKind, body?: string) => void): void {
  let i = -1
  let text = ""
  let match: RegExpMatchArray
  let token: string
  let tokens = s.split(opts.splitter || defaultSplitter)

  while (++i < tokens.length) {
    token = tokens[i]

    if (0 !== i % 2) {
      free()

      match = token.match(opts.matcher || defaultMatcher)

      if (!match) {
        return void cb(new Error(`scan error: ${token}`))
      }

      cb(null, (opts.symbolMap || defaultSymbolMap)[match[1]], match[2])
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
