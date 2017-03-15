### Install

With `npm` or `yarn`, do:

```
npm install xup
```

If you also want to use the command-line interface, install it globally:

```
npm install xup --global
```

### Example

```typescript
import xup = require("xup/react")
import ReactDOM = require("react-dom")

ReactDOM.render(xup("<div>{title}</div>", { title: "Hello, world!" }))
```

### Extending

TODO