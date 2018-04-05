---
id: version-5.1.2-metadata
title: Metadata
sidebar_label: Metadata
original_id: metadata
---

If you want to transfer metadata to a service you can use the `meta$` property in your pattern. It will be passed in all nested calls. A common use case is to add a JWT token.

### Caveats

* Metadata is transfered

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req, cb) {
    //Access to metadata
    let meta = this.meta$

    cb(null, req.a + req.b)
  }
)
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    meta$: { a: 'test' }
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

## Attach it outside of the pattern

```js
hemera.meta$.token = 'ABC1234'
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1
  },
  function(err, resp) {
    //or
    this.meta$.token = 'ABC1234'

    this.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 5
    })
  }
)
```
