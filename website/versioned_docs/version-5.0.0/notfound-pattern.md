---
id: version-5.0.0-notfoundPattern
title: Not found pattern
sidebar_label: Not found pattern
original_id: notfoundPattern
---

You can define a pattern which is used as fallback as soon a pattern could not be found on client side. This is very useful for debugging and logging purposes.

```js
hemera.setNotFoundPattern({
  topic: 'math',
  cmd: 'notFound'
})
hemera.add(
  {
    topic: 'math',
    cmd: 'notFound'
  },
  function(req, done) {
    this.log.info('Not found')
    done()
  }
)
```
