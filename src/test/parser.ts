import test = require("tape")
import { util } from ".."
import { tokenize } from "../lexer"
import { parse } from "../parser"

const randomFixtures = [
    {
        html: '<x class={foo} for="{foo} {bar}">{bar}</x>',
        expected: [
            "x",
            {
                class: [ [ 3, "foo" ] ],
                for: [ [ 3, "foo" ], " ", [ 3, "bar" ] ]
            },
            [ [ 3, "bar" ] ]
        ]
    },
    {
        // tslint:disable-next-line:max-line-length
        html: '<x><d>bla</d> {#foo} <y> <z>bom <c>{qux} {sox}</c><k></k></z>{quux} </y>bum {#bar}555<r></r><u></u>{/bar} 888{/foo} <k></k>333<d>{#qux}999{/qux}<h x="{nope}"></h></d> {jj}{dd}uu</x>',
        expected: [ "x", {},
            [
                [ "d", {}, [ "bla" ] ],
                " ",
                [ 2,
                "foo",
                [
                    " ",
                    [ "y", {},
                    [
                        " ",
                        [ "z", {},
                        [
                            "bom ",
                            [ "c", {},
                            [
                                [ 3, "qux" ],
                                " ",
                                [ 3, "sox" ]
                            ]
                            ],
                            [ "k", {}, [] ]
                        ]
                        ],
                        [ 3, "quux" ],
                        " "
                    ]
                    ],
                "bum ",
                [ 2, "bar",
                    [
                    "555",
                    [ "r", {}, [] ],
                    [ "u", {}, [] ]
                    ]
                ],
                " 888" ]
                ],
                " ",
                [ "k", {}, [] ],
                "333",
                [ "d", {}, [ [ 2, "qux", [ "999" ] ], [ "h", { x: [ [ 3, "nope" ] ] }, [] ] ] ],
                " ",
                [ 3, "jj" ],
                [ 3, "dd" ],
                "uu"
            ]
        ]
    },
    {
        html: '<tr bg="{#hasx}{x}{/hasx}"><td bg={name} ag="{name} is" /></tr>',
        expected: [
            "tr",
            { bg: [ [ 2, "hasx", [ [ 3, "x" ] ] ] ] }, /* props */
            [
                [ "td", { bg: [ [ 3, "name" ] ], ag: [ [ 3, "name" ], " is" ] }, [] /* no children */ ]
            ]
        ]
    }
]

test("build parse trees", t => {
    t.plan(randomFixtures.length)
    randomFixtures.forEach(fixture => {
        util.fromString(fixture.html)
            .pipe(tokenize())
            .pipe(parse())
            .once("data", actual => {
                t.deepEqual(actual, fixture.expected)
            })
    })
})

test("emit top-level parsing errors", t => {
  const expected = [/text/, /section/, /variable/]
  t.plan(expected.length * 2)

  let i = 0
  function s() {
    const s = parse()
    const stacheStream = tokenize()
    stacheStream.pipe(s)
    s.on("error", (err: Error) => {
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
