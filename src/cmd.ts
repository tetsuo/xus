#!/usr/bin/env node

import * as path from "path"
import * as minimist from "minimist"

const argv: any = minimist(process.argv.slice(2), {
    alias: {
        v: "version",
        h: "help"
    }
})

const file: string = argv._[0]

if ((!file && !argv.version) || argv.help) {
    showUsage()
} else if (argv.version) {
    console.log("v" + require("../package.json").version)
    process.exit(0)
} else {
	throw new Error("not implemented")
}

function showUsage() {
    const usage =
        `xup FILE {OPTIONS}

Options:

  -v, --version  show version number
  -h, --help     show this message
`
    console.log(usage)
    process.exit(0)
}
