---
id: propagation
title: Propagation
sidebar_label: Propagation
---

If you call a service which internally call many other services and suddenly a service fails, this error must be propagated to the first callee. In order to avoid storing very long error chains we do not collect all errors in the chain but the root issue.

```js
const nats = require('nats').connect(authUrl)
const hemera = new Hemera(nats)
const UnauthorizedError = Hemera.createError('Unauthorized')

hemera.ready(() => {
  hemera.add(
    {
      topic: 'a',
      cmd: 'a'
    },
    function(resp, cb) {
      const a = new UnauthorizedError('test')
      a.test = 444
      cb(a)
    }
  )

  hemera.act(
    {
      topic: 'a',
      cmd: 'a'
    },
    function(err, resp) {
      // err instanceof UnauthorizedError
    }
  )
})
```

## Hops error property

In addition to default error properties the `hops` property is added to understand which services were involved in the operation.

```json
{
  name: "Unauthorized",
  message: "test",
  stack: "....",
  test: 444,
  hops: [
    {
      service: "a",
      method: "cmd:a,topic:a",
      app: "hemera-starptech",
      ts: 522330692412
    }
  ]
}
```
