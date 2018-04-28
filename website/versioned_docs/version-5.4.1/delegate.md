---
id: version-5.4.1-delegate
title: Delegate
sidebar_label: Delegate
original_id: delegate
---

If you want to pass data only to the next `add` you can use `delegate$` property. This feature is used to transfer contextual data to tracing systems.

### Caveats

* Delegate data is transfered
* Delegate data is **not** transfered in childs calls of your `add`

```js
hemera.act({
  topic: 'math',
  cmd: 'add',
  delegate$: { foo: 'bar' }
})

hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req, cb) {
    this.delegate$.foo
  }
)
```

## Attach it outside of the pattern

```js
hemera.delegate$.a = 'foobar'
hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1
  },
  function(err, resp) {}
)
```
