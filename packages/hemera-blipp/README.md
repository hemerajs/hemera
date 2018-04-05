# Hemera-blipp package

[![npm](https://img.shields.io/npm/v/hemera-blipp.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-blipp)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

Prints your server actions to the console. So each time hemera starts, you know which actions are available.

## Example

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-blipp'))
```

## Symbols

* `REQ:` Registered with request / reply semantics.
* `PUB:` Registered with publish / subscribe semantics.
* `$:` Indicates that special dollar options are used.

## Output

```
🏷️  Actions:
REQ     topic:math,cmd:add
REQ     topic:math,cmd:sub
PUB/$   topic:notify
```
