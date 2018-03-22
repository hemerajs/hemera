---
id: error-serialization
title: Error serialization
sidebar_label: Serialization
---

You can create custom errors with `Hemera.createError(name)` method which can be compared across processes. You can change the serialization/deserialization behaviour with the `errio` config property. For detail informations look in the repository of [errio](https://github.com/programble/errio).

## Example

```js
// service.js
const UnauthorizedError = Hemera.createError('Unauthorized')
hemera.add(
  {
    topic: 'a',
    cmd: 'a'
  },
  function(resp, cb) {
    const a = new UnauthorizedError('test')
    cb(a)
  }
)

// index.js
const UnauthorizedError2 = Hemera.createError('Unauthorized')
hemera.act(
  {
    topic: 'a',
    cmd: 'a'
  },
  function(err, resp) {
    console.log(err instanceof UnauthorizedError2) // true
  }
)
```
