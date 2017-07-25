import test = require("tape")
import { compile } from ".."
import { Template } from "../runtime"

function build(html: string, state: any, options: any, cb: (buildError, node? , html?: string) => void) {
    compile(html, {}, (transformError, render?) => {
        if (transformError) {
            return cb(transformError)
        }
        cb(null, render.call(new Template, state, options), html)
    })
}

const fixtures = [
    {
        // object is accessible within the scope
        html: "<x>{yar}{#bar}{nor}<k>{ssw}</k>{/bar}</x>",
        state: {
            yar: "555",
            bar: [ { nor: "xyz", ssw: "rre" } ]
        },
        expected: {
            tag: "x",
            props: {},
            children: [
                "555",
                "xyz",
                { tag: "k", props: {}, children: [ "rre" ] }
            ]
        }
    },
    {
        // nested array sections
        html: "<x>{#bar}<u>{#da}<k>{m}{#ow}8<z></z>{/ow}</k>{/da}</u>{#dor}{kw}{#mor}{sd}55{/mor}df{ke}1s{/dor}63{jh}{/bar}{kq}</x>",
        state: {
            kq: "qkw",
            bar: {
                da: {
                    m: "ram",
                    ow: [ 1, 1, 1 ]
                },
                dor: {
                    kw: "ghj",
                    mor: [
                        { sd: "77" },
                        { sd: "55" }
                    ],
                    ke: "s1"
                },
                jh: "6734"
            }
        },
        expected: {
            tag: "x",
            props: {},
            children: [
                {
                    tag: "u",
                    props: {},
                    children: [
                        {
                            tag: "k",
                            props: {},
                            children: [
                                "ram",
                                "8",
                                { tag: "z", props: {}, children: [] },
                                "8",
                                { tag: "z", props: {}, children: [] },
                                "8",
                                { tag: "z", props: {}, children: [] }
                            ]
                        }
                    ]
                },
                "ghj",
                "77",
                "55",
                "55",
                "55",
                "df",
                "s1",
                "1s",
                "63",
                "6734",
                "qkw"
            ]
        }
    },
    {
        html: "<x>{#s}{s}{#z}{c}{/z}{#u}{k}{#r}{u}{#y}55{/y}{/r}{/u}{/s}</x>",
        state: {
            s: {
                s: "sd",
                z: false,
                u: [
                    {
                        k: "12",
                        r: [
                            { u: "34" },
                            { u: "23", y: true }
                        ]
                    },
                    {
                        k: "65",
                        r: [ { u: "89" } ]
                    }
                ]
            }
        },
        expected: {
            tag: "x",
            props: {},
            children: [
                "sd",
                "12",
                "34",
                "23",
                "55",
                "65",
                "89"
            ]
        }
    },
    {
        html: "<x>{^s}foo{/s}</x>",
        state: {
            s: true
        },
        expected: {
            tag: "x",
            props: {},
            children: [
            ]
        }
    },
    {
        html: "<x>{^s}foo{/s}</x>",
        state: {
            s: false
        },
        expected: {
            tag: "x",
            props: {},
            children: [
                "foo"
            ]
        }
    },
    {
        html: "<x>{^s}foo{/s}</x>",
        state: {
            s: []
        },
        expected: {
            tag: "x",
            props: {},
            children: [
                "foo"
            ]
        }
    },
    {
        html: "<x>{^s}{x}{/s}</x>",
        state: {
            s: { x: 1 }
        },
        expected: {
            tag: "x",
            props: {},
            children: [
            ]
        }
    }
]

test("static trees", t => {
    t.plan(fixtures.length * 2)

    fixtures.forEach(fixture => {
        build(fixture.html, fixture.state, {
            createElement: (tag, props, children) => {
                delete props.parseTree
                delete props.traverseChildren
                delete props.state
                return { tag, props, children }
            }
        }, (buildError, actual, html) => {
            t.error(buildError, html)
            t.deepEqual(actual, fixture.expected)
        })
    })
})
