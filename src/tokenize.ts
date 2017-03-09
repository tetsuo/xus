import through = require("through2")
import {Parser} from "htmlparser2"
import stream = require("stream")
import {IToken, ITokenKind} from "./types"
const combine = require("stream-combiner2")

/*
export function stache() {
  const tr = through.obj(function(row, enc, next) {
    if (row[])

  })
  const tr = through.obj(function (row, enc, next) {
    if (row[0] === "text") {
      scan(row[1], function (type, value) {
        tr.push([type, value]);
      });
    } else this.push(row);
    next();
  });
  return combine(tokenize(), tr);
};

var tags = {
  "": "variable",
  "#": "section:open",
  "/": "section:close" 
};

function scan (s, cb) {
  var i = -1, text = "", match, token,
      tokens = s.split(/({[^}]+})/);
  while (++ i < tokens.length) {
    token = tokens[i];
    if (0 !== i % 2) {
      free();
      match = token.match(/^{\s*([#\/]?)(\w+)\s*}$/);
      if (!match) throw new Error("scan error: " + token);
      cb(tags[match[1]], match[2]);
    } else text += token;
  }
  function free () {
    if (text.length) {
      cb("text", text);
      text = "";
    }
  }
  free();
}
*/

export const KindByTagSymbol = {
  "" : ITokenKind.Variable,
  "#": ITokenKind.SectionOpen,
  "/": ITokenKind.SectionClose
}
export const stacheSplitter = /({[^}]+})/
export const stacheMatcher = /^{\s*([#\/]?)(\w+)\s*}$/

export function scan(s: string, cb: (er: Error|null, kind?: ITokenKind, body?: string) => void) {
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

export function stache(): stream.Transform {
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

  return combine.obj(html(), tr)
}

export function html(): stream.Transform {
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

  const tr = through.obj((row, enc, next) => {
    parser.write(row)
  })

  function push(kind: ITokenKind, value: string, attrs = null) {
    tr.push([ kind, value, attrs ])
  }

  return tr
}
