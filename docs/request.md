---
id: request
title: Request
sidebar_label: Request
---

Hemera generate and collect some request informations which are available under `this.request$`.

### Caveats

* Request data is transfered
* Each call generate new request data

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req, cb) {
    cb(null, req.a + req.b)
  }
)
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    requestId$: '123456' // can be omitted
  },
  function(err, resp) {
    // Access to request data
    let request = this.request$
    this.act(
      {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 5
      },
      function(err, resp) {
        // Access to request data
        let request = this.request$
      }
    )
  }
)
```

## Available properties

```js
{ id: 'f66205339b0d478ab880e13624f72dbf',
  type: 'request',
  service: 'math',
  method: 'a:1,b:20,cmd:add,topic:math' }
```

## Use different ID generator

```js
hemera.setIdGenerator(() => Date.now().toString())
```
