---
id: fatal
title: Fatal
sidebar_label: Fatal
---

Fatal errors will crash your server. You should implement a gracefully shutdown and use a process watcher like [PM2](http://pm2.keymetrics.io/) to come back in a clear state.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(resp, cb) {
    throw new Error('Upps')
  }
)

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
