---
id: version-5.0.0-timeout
title: Timeout
sidebar_label: Timeouts
original_id: timeout
---

NATS is fire and forget, reason for which a client times out could be many things:

* No one was connected at the time (service unavailable)
* Service is actually still processing the request (service takes too long)
* Service was processing the request but crashed (service error)

```js
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1
  },
  function(err, resp) {
    // err instanceOf TimeoutError
  }
)
```

## Change global timeout

```js
const hemera = new Hemera(nats, { timeout: 3000 })
```

## Change timeout per call

```js
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    timeout$: 5000
  },
  function(err, resp) {}
)
```
