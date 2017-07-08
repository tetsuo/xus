import { shallow } from "enzyme"
import test = require("tape")
import { observable } from "mobx"
import * as mobxReact from "mobx-react"
import * as React from "react"
import { xus as build } from "../"

const options = {
    createElement: React.createElement,
    observer: mobxReact.observer
}

test("render text and vars", t => {
    const state = observable({
        baz: 456,
        bar: 123
    })

    build("<x>sdf{baz}k{bar}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        // debugger
        const w = shallow(el)

        t.equal(w.html(), "<x>sdf456k123</x>")

        state.bar = 777
        state.baz = 555

        t.equal(w.html(), "<x>sdf555k777</x>")

        t.end()
    })
})

test("render single var", t => {
    const state = observable({
        baz: 456
    })

    build("<x>{baz}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x>456</x>")

        state.baz = 123
        t.equal(w.html(), "<x>123</x>")

        t.end()
    })
})

test("render conditional block", t => {
    const state = observable({
        show: true
    })

    build("<x>{#show}sdf{/show}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x>sdf</x>")

        state.show = false
        t.equal(w.html(), "<x></x>")

        state.show = true
        t.equal(w.html(), "<x>sdf</x>")

        t.end()
    })
})

test("render object", t => {
    const state = observable({
        bar: { name: "Mango", z: 333 },
        baz: { name: "Kiwi" }
    })

    build("<x>{#bar}{name}k{z}{/bar}kd{#baz}{name}{/baz}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x>Mangok333kdKiwi</x>")

        state.bar.name = "Apple"
        t.equal(w.html(), "<x>Applek333kdKiwi</x>")

        state.baz.name = "Appel"
        t.equal(w.html(), "<x>Applek333kdAppel</x>")

        t.end()
    })
})

test("render array 1", t => {
    const state = observable({
        fruits: [
            { name: "Mango" },
            { name: "Kiwi" }
        ]
    })

    build("<x>{#fruits}<y>{name}</y>{/fruits}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x><y>Mango</y><y>Kiwi</y></x>")

        state.fruits[1].name = "Appel"
        t.equal(w.html(), "<x><y>Mango</y><y>Appel</y></x>")

        state.fruits.push({ name: "Oranje" })
        t.equal(w.html(), "<x><y>Mango</y><y>Appel</y><y>Oranje</y></x>")

        t.end()
    })
})

test("render array", t => {
    const state = observable({
        fruits: [
            { name: "Mango" },
            { name: "Kiwi" }
        ]
    })

    build("<x>{#fruits}<y>{name}</y>{/fruits}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x><y>Mango</y><y>Kiwi</y></x>")

        state.fruits[1].name = "Appel"
        t.equal(w.html(), "<x><y>Mango</y><y>Appel</y></x>")

        state.fruits.push({ name: "Oranje" })
        t.equal(w.html(), "<x><y>Mango</y><y>Appel</y><y>Oranje</y></x>")

        t.end()
    })
})

test("render collection", t => {
    const state = observable({
        first: [
            { n: 1 },
            { n: 2 }
        ]
    })

    build("<x>{#first}{n}{/first}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x>12</x>")
        state.first[0].n = 3

        t.equal(w.html(), "<x>32</x>")

        state.first.push({ n: 4 })
        t.equal(w.html(), "<x>324</x>")

        state.first.splice(0, 1)
        t.equal(w.html(), "<x>24</x>")

        state.first.unshift({ n: 5 })
        t.equal(w.html(), "<x>524</x>")

        state.first[0].n = 3
        t.equal(w.html(), "<x>324</x>")

        t.end()
    })
})

test("render vars scope", t => {
    const state = observable({
        a: {
            b: [
                { n: 3 },
                { n: 4 }
            ],
            n: 5
        },
        n: {
           n: 7
        }
    })

    build("<x>{#a}{n}{#b}{n}{/b}{/a}{#n}{n}{/n}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x>5347</x>")

        state.a.b[1].n = 42
        t.equal(w.html(), "<x>53427</x>")

        state.a.b.unshift({ n: 8 })
        t.equal(w.html(), "<x>583427</x>")

        state.a.n = 9
        t.equal(w.html(), "<x>983427</x>")

        state.n.n = 1
        t.equal(w.html(), "<x>983421</x>")

        t.end()
    })
})

test("render arrays scope", t => {
    const state = observable({
        a: [
            {
                n: [
                    { n: 6 },
                    { n: 7 }
                ],
                m: {
                    n: 8
                }
            },
            {
                n: [
                    { n: 555 }
                ],
                m: {
                    n: 333
                }
            }
        ]
    })

    build("<x>{#a}{#n}{n}{/n}{#m}{n}{/m}{/a}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x>678555333</x>")

        state.a[1].m.n = 9
        t.equal(w.html(), "<x>6785559</x>")

        state.a[0].m.n = 21
        t.equal(w.html(), "<x>67215559</x>")

        state.a.splice(1, 1, {
            n: [
                { n: 777 },
                { n: 999 }
            ],
            m: {
                n: 444
            }
        })
        t.equal(w.html(), "<x>6721777999444</x>")

        t.end()
    })
})

test("render conditional scope 1", t => {
    const state = observable({
        a: {
            c: false,
            n: 3,
            m: [
                { n: 9 },
                { n: 8 }
            ],
            k: {
                z: 3
            }
        },
        n: false
    })

    build("<x>{#n}{#a}{n}{#c}t{#k}{z}{/k}{#m}{n}{/m}{/c}{#k}{z}y{/k}{/a}{/n}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x></x>")

        state.n = true
        t.equal(w.html(), "<x>33y</x>")

        state.n = false
        t.equal(w.html(), "<x></x>")

        state.a.n = 9
        state.n = true
        t.equal(w.html(), "<x>93y</x>")

        state.a.c = true
        t.equal(w.html(), "<x>9t3983y</x>")

        state.a.m.splice(1, 1, { n: 4 }, { n: 7 })
        t.equal(w.html(), "<x>9t39473y</x>")

        state.a.c = false
        t.equal(w.html(), "<x>93y</x>")

        t.end()
    })
})

test("render conditional scope 2", t => {
    const state = observable({
        bar: {
            f: [
                { d: 1 },
                { d: 2 }
            ],
            baz: 3,
            c: true
        },
        c: true,
        y: false
    })

    build("<x>{#c}<k>{#y}{#bar}<i>{#f}{d}m{/f}</i>{#c}{baz}{/c}{/bar}{/y}</k>{/c}</x>", state, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)

        t.equal(w.html(), "<x><k></k></x>")

        state.y = true
        t.equal(w.html(), "<x><k><i>1m2m</i>3</k></x>")

        state.bar.f.splice(1, 1, { d: 7 })
        t.equal(w.html(), "<x><k><i>1m7m</i>3</k></x>")

        state.bar.f[1].d = 8
        t.equal(w.html(), "<x><k><i>1m8m</i>3</k></x>")

        state.bar.baz = 6
        t.equal(w.html(), "<x><k><i>1m8m</i>6</k></x>")

        state.bar.c = false
        t.equal(w.html(), "<x><k><i>1m8m</i></k></x>")

        state.bar.c = true
        t.equal(w.html(), "<x><k><i>1m8m</i>6</k></x>")

        t.end()
    })
})

test("convert to jsx attrs", t => {
    build("<div class=xw><input class=de type=radio /><textarea value=555 /><input type=text value=333 /></div>", {}, options, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)
        t.equal(w.html(), '<div class="xw"><input class="de"/><textarea>555</textarea><input value="333"/></div>')
        t.end()
    })
})

test("component registry", t => {
    const state = { n: 1 }

    function foo(props) {
        return React.createElement("c", props, React.createElement("b", {}, "bold"), props.children)
    }

    const optionsWithRegistry = {
        ...options,
        ...{
            registry: {
                foo: foo
            }
        }
    }

    build("<div>{n}<foo class=bla>{n}<bar>{n}6</bar>{n}25</foo></div>", state, optionsWithRegistry, (buildError, el: React.ReactElement<any>, html) => {
        t.error(buildError, html)
        const w = shallow(el)
        t.equal(w.html(), '<div>1<c class="bla"><b>bold</b>1<bar>16</bar>125</c></div>')
        t.end()
    })
})

test("tags in attrs 1", t => {
    const state = observable({
        foo: "qux",
        bar: "quux"
    })

    build('<x class={foo} for="{foo} {bar}">{bar}</x>', state, options, (er, el: React.ReactElement<any>, html) => {
        t.error(er, html)
        const w = shallow(el)

        t.equal(w.html(), '<x class="qux" for="qux quux">quux</x>')

        state.bar = "baz"
        t.equal(w.html(), '<x class="qux" for="qux baz">baz</x>')

        t.end()
    })
})

test("tags in attrs 2", t => {
    const state = observable({
        foo: [ { n: 3 }, { n: 5 } ],
        bar: "quux"
    })

    build('<x for="{#foo}{n} {/foo}"><p>{bar}{#foo}{n}{/foo}</p>{#foo}{n}{/foo}</x>', state, options, (er, el: React.ReactElement<any>, html) => {
        t.error(er, html)
        const w = shallow(el)

        t.equal(w.html(), '<x for="3 5 "><p>quux35</p>35</x>')

        state.foo.push({ n: 7 })
        t.equal(w.html(), '<x for="3 5 7 "><p>quux357</p>357</x>')

        t.end()
    })
})

test("tags in attrs 3", t => {
    const state = observable({
        cond: true,
        bar: "quux",
        cond2: false
    })

    build('<x class="{#cond}{bar}{/cond}">{#cond}{bar}{#cond2}23{/cond2}{/cond}</x>', state, options, (er, el: React.ReactElement<any>, html) => {
        t.error(er, html)
        const w = shallow(el)

        t.equal(w.html(), '<x class="quux">quux</x>')

        state.cond = false
        t.equal(w.html(), '<x class=""></x>')

        state.cond = true
        state.cond2 = true
        t.equal(w.html(), '<x class="quux">quux23</x>')

        t.end()
    })
})
