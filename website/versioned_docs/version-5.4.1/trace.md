---
id: version-5.4.1-trace
title: Trace
sidebar_label: Trace
original_id: trace
---

Hemera comes already with good tracing capabilities.
If you want to transfer additional trace data to a service you can use the `trace$` property in your pattern. It will be passed in all nested calls. A common use case is to add additional data to preserve the context across process communication.

### Caveats

* Trace data is transfered
* Trace data is pass to all child calls

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req, cb) {
    // Access to trace data
    let trace = this.trace$

    cb(null, req.a + req.b)
  }
)
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    trace$: { a: 'test' }
  },
  function(err, resp) {
    this.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 5
    })
  }
)
```

## Available properties

```js
{ spanId: '6a39893471dd4e4d846ac85ab2e1f520',
  traceId: 'b5431cade9b0443f8cb7b4aefe11db6f',
  timestamp: 1436028778860940,
  service: 'math',
  method: 'a:1,b:20,cmd:add,topic:math' }
```

## Attach it outside of the pattern

```js
hemera.trace$.parentSpanId = 'ABC1234'
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1
  },
  function(err, resp) {
    //or
    hemera.trace$.parentSpanId = 'ABC1234'

    this.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 5
    })
  }
)
```

## Use different ID generator

```js
hemera.setIdGenerator(() => Date.now().toString())
```
