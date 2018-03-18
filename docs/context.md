---
id: context
title: Context
sidebar_label: Context
---

If you want to set a context across all calls you can use the `context$` property.

### Caveats

* Context is **not** transfered

```js
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    context$: 1
  },
  function(err, resp) {
    //or
    this.act(
      {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 5
      },
      function(err, resp) {
        this.context$ // 1
      }
    )
  }
)
```

## Attach it outside of the pattern

```js
hemera.context$.a = 'foobar'
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1
  },
  function(err, resp) {
    this.context$.a // "foobar"

    this.act(
      {
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 5
      },
      function(err, resp) {
        this.context$.a // "foobar"
      }
    )
  }
)
```
