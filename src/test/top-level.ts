import compile = require("../compile")
import tokenize = require("../tokenize")
import test = require("tape")

test("emit top-level errors", function (t) {
  const expected = [ /text/, /section/, /variable/ ]
  t.plan(expected.length * 2)

  let i = 0
  function s() {
    const s = compile.buildTree()
    const stacheStream = tokenize.stache()
    stacheStream.pipe(s)
    s.on("error", function (err: Error) {
      t.ok(err instanceof Error)
      t.ok(err.message.match(expected[i]))
      ++i
    })
    return stacheStream
  }

  s().end("bla")
  s().end("{#x}{/x}")
  s().end("{x}")
})
