---
id: error-handling
title: Error-handling
sidebar_label: Introduction
---

Hemera won't catch any thrown error expect you are using async/await. It's up to the developer to handle business specific issues. Ensure that your process is restarted e.g with a process-manager like PM2.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req, cb) {
    throw new Error()
  }
)
```

## Asynchronous errors

In asynchronous code, the application cannot catch exceptions as you’ve lost your stack once you have entered a callback:

```js
hemera.add({ topic: 'math', cmd: 'add' }, function(req, cb) {
  process.nextTick(() => {
    throw new Error()
  })
})
```

## Request error

The first argument of your act handler is the request error.

```js
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

## Server error

We support error-first-callback style as well as promise and async / await. Use one style but be consistent.

* Error-first-callback
  ```js
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req, cb) {
      cb(new Error('Invalid operation'))
    }
  )
  ```
* Promise
  ```js
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req) {
      return Promise.reject(new Error('Invalid operation'))
    }
  )
  ```
* Async / Await
  ```js
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    async function(req) {
      throw new Error('Invalid operation')
    }
  )
  ```
