const React = require("react")
const ReactDOM = require("react-dom")
const mobx = require("mobx")
const xup = require("../../lib/react")

const state = mobx.observable({
	title: "fruits",
	fruits: [
		{ name: "Kiwi" },
		{ name: "Mango" }
	]
})

window.state = state

xup.buildReact(`<div>
	<h1>{title}</h1>
	<ul>{#fruits}<li>{name}</li>{/fruits}</ul>
	</div>`, state, (er, res) => {
	if (er) {
		throw er
	}

	ReactDOM.render(res, document.getElementById("main"))
})