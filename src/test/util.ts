export class AbstractVTextClass { constructor(public text) {} }
export class AbstractVNodeClass { constructor(public tag, public props, public children) {} }

export const fixturesDir = __dirname + "/../../fixtures"
