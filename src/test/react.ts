import test = require("tape")
import {buildReact} from "../react"
import {shallow} from "enzyme"

test("render react", t => {
    const state = {
        title: "fruits",
        fruits: [
            { name: "Kiwi" },
            { name: "Mango" }
        ]
    }
    buildReact(`
    <div>
        <h1>{title}</h1>
        {#fruits}
            <li>{name}</li>
        {/fruits}
    </div>
    `, state, (er, res) => {
        t.error(er)
        const w = shallow(res)
        t.equal(w.html(), "<div><h1><span>fruits</span></h1><li><span>Kiwi</span></li><li><span>Mango</span></li></div>") // TODO: span issue
        t.end()
    })
})
