import test = require("tape")
import {buildReact} from "../react"
import {shallow} from "enzyme"
import {observable} from "mobx"

test.only("render react", t => {
    const state = observable({
        title: "fruits",
        title2: "meyveler",
        fruits: [
            { name: "Kiwi" },
            { name: "Mango" }
        ]
    })

    buildReact(`<div><h1>{title}</h1><h2>{title2}</h2><ul>{#fruits}<li>blabla{name}</li>{/fruits}</ul></div>`, state, (er, res) => {
        t.error(er)
        const w = shallow(res)
        console.log(w.html())
        state.title="bla"
        console.log(w.html())
        // state.title2="foo"
        state.fruits.push({ name: "Apple" })
        console.log(w.html())
        // t.equal(w.html(), "<h1><span>fruits</span></h1>") // TODO: span issue
        // state.title = "blabla"
        // t.equal(w.html(), "<h1><span>blabla</span></h1>")
        // console.log(w.html())
        t.end()
    })
})
