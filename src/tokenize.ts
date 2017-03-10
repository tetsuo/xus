import through = require("through2")
import {Parser} from "htmlparser2"
import {IToken, ITokenKind, ICommonAttrs} from "./types"
const pumpify = require("pumpify")
const duplexify = require("duplexify")

export const stacheSplitter = /({[^}]+})/
export const stacheMatcher = /^{\s*([#\/]?)(\w+)\s*}$/

export const KindByTagSymbol = {
  "" : ITokenKind.Variable,
  "#": ITokenKind.SectionOpen,
  "/": ITokenKind.SectionClose
}

/**
 * Scan a string for stache tags and emit tokens.
 *
 * @param s   Text to be scanned.
 * @param cb  Callback will be called for each seen tag.
 */
export function scan(s: string, cb: (er: Error|null, kind?: ITokenKind, body?: string) => void): void {
  let i = -1,
      text = "",
      match: RegExpMatchArray,
      token: string,
      tokens = s.split(stacheSplitter)

  while (++i < tokens.length) {
    token = tokens[i]

    if (0 !== i % 2) {
      free()

      match = token.match(stacheMatcher)

      if (!match) {
        return void cb(new Error(`scan error: ${token}`))
      }

      cb(null, KindByTagSymbol[match[1]], match[2])
    } else {
      text += token
    }
  }

  function free () {
    if (text.length) {
      cb(null, ITokenKind.Text, text)
      text = ""
    }
  }

  free()
}

/**
 * Transform stream to tokenize mustache.
 *
 * Returns a transform stream that takes stache input and produces rows of output.
 *
 * The output rows are of the form: [ type, tag|text[, attrs] ]
 */
export function stache(): NodeJS.ReadWriteStream {
  const tr = through.obj(function(token: IToken, enc, next) {
    const [ kind, value ] = token

    if (kind === ITokenKind.Text) {
      scan(value, function(er, kind, body) { // scan stache
        if (er) {
          return void tr.emit(er.message)
        }
        tr.push([ kind, body ])
      })
    } else {
      this.push(token)
    }

    next()
  })

  return pumpify.obj(html(), tr)
}

/**
 * Streaming HTML tokenizer.
 *
 * Returns a transform stream that takes html input and produces rows of output
 * using forgiving 'htmlparser2'.
 *
 * The output rows are of the form: [ type, tag|text[, attrs] ]
 */
export function html(): NodeJS.ReadWriteStream {
  const parser = new Parser({
    onopentag: function(name, attrs) {
      push(ITokenKind.Open, name, attrs)
    },
    onclosetag: function(value) {
      push(ITokenKind.Close, value)
    },
    ontext: function(value) {
      push(ITokenKind.Text, value)
    }
  })

  const tr = through.obj()

  function push(kind: ITokenKind, value: string, attrs?: ICommonAttrs) {
    const token: IToken = [ kind, value ]
    if (attrs) {
      token.push(attrs)
    }
    tr.push(token)
  }

  return duplexify.obj(parser, tr)
}
