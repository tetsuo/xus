import test = require("tape")
import lexer = require("../lexer")
import { util } from ".."

test("tokenize html", t => {
    const html =
`<table cols=3>
  <tbody>blah blah blah</tbody>
  <tr><td>there</td></tr>
  <tr><td>it</td></tr>
  <tr><td bgcolor="blue">is</td></tr>
</table>`

    const expected = [
        [ 1, "table", { cols: [ [ 3, "3" ] ] } ],
        [ 3, "\n  " ],
        [ 1, "tbody", {} ],
        [ 3, "blah blah blah" ],
        [ 2, "tbody" ],
        [ 3, "\n  " ],
        [ 1, "tr", {} ],
        [ 1, "td", {} ],
        [ 3, "there" ],
        [ 2, "td" ],
        [ 2, "tr" ],
        [ 3, "\n  " ],
        [ 1, "tr", {} ],
        [ 1, "td", {} ],
        [ 3, "it" ],
        [ 2, "td" ],
        [ 2, "tr" ],
        [ 3, "\n  " ],
        [ 1, "tr", {} ],
        [ 1, "td", { bgcolor: [ [ 3, "blue" ] ] } ],
        [ 3, "is" ],
        [ 2, "td" ],
        [ 2, "tr" ],
        [ 3, "\n" ],
        [ 2, "table" ]
    ]

    t.plan(expected.length)

    util.fromString(html)
        .pipe(lexer.tokenize())
        .on("data", data => {
            const x = expected.shift()
            t.deepEqual(data, x)
        })
})

test("tokenize stache", t => {
    const html =
`<table cols=3>
  {#fruits}
    <tr>
      <td bgcolor="blue">{name}</td>
      {#proteins}<td>{name}</td>{/proteins}
    </tr>
  {/fruits}
</table>`

    const expected = [
        [ 1, "table", { cols: [ [ 3, "3" ] ] } ],
        [ 3, "\n  " ],
        [ 5, "fruits" ],
        [ 3, "\n    " ],
        [ 1, "tr", {} ],
        [ 3, "\n      " ],
        [ 1, "td", { bgcolor: [ [ 3, "blue" ] ] } ],
        [ 4, "name" ],
        [ 2, "td" ],
        [ 3, "\n      " ],
        [ 5, "proteins" ],
        [ 1, "td", {} ],
        [ 4, "name" ],
        [ 2, "td" ],
        [ 6, "proteins" ],
        [ 3, "\n    " ],
        [ 2, "tr" ],
        [ 3, "\n  " ],
        [ 6, "fruits" ],
        [ 3, "\n" ],
        [ 2, "table" ]
    ]

    t.plan(expected.length)

    util.fromString(html)
        .pipe(lexer.tokenize())
        .on("data", data => {
            const x = expected.shift()
            t.deepEqual(data, x)
        })
})

test("tokenize attrs", t => {
    const html =
`<table cols={numcols}>
  {#fruits}
    <tr bgcolor="{#isx}{xthing}{/isx}">
      <td bgcolor="{bgcolor}">{name}</td>
      {#proteins}<td class='{foo} {bar} xxx'>{name}</td>{/proteins}
    </tr>
  {/fruits}
</table>`

    const expected = [
        [ 1, "table",
            {
                cols: [
                    [ 4, "numcols" ]
                ]
            }
        ],
        [ 3, "\n  " ],
        [ 5, "fruits" ],
        [ 3, "\n    " ],
        [ 1, "tr",
            {
                bgcolor: [
                    [ 5, "isx" ],
                    [ 4, "xthing" ],
                    [ 6, "isx" ]
                ]
            }
        ],
        [ 3, "\n      " ],
        [ 1, "td",
            {
                bgcolor: [
                    [ 4, "bgcolor" ]
                ]
            }
        ],
        [ 4, "name" ],
        [ 2, "td" ],
        [ 3, "\n      " ],
        [ 5, "proteins" ],
        [ 1, "td",
            {
                class: [
                    [ 4, "foo" ],
                    [ 3, " " ],
                    [ 4, "bar" ],
                    [ 3, " xxx"]
                ]
            }
        ],
        [ 4, "name" ],
        [ 2, "td" ],
        [ 6, "proteins" ],
        [ 3, "\n    " ],
        [ 2, "tr" ],
        [ 3, "\n  " ],
        [ 6, "fruits" ],
        [ 3, "\n" ],
        [ 2, "table" ]
    ]

    t.plan(expected.length)

    util.fromString(html)
        .pipe(lexer.tokenize())
        .on("data", data => {
            const x = expected.shift()
            t.deepEqual(data, x)
        })
})
