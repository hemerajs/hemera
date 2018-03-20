---
id: version-5.0.0-rc.2-error-handling
title: Error-handling
sidebar_label: Introduction
original_id: error-handling
---

Hemera won't catch any thrown error expect you are using async/await. It's up to the developer to handle business specific issues. Ensure that your process is restarted e.g with a process-manager like [PM2](http://pm2.keymetrics.io/).

This will crash your application:
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

## Style

We support error-first-callback style as well as promise and async / await. Use one style but be consistent.

## Handle a request error

* Error-first-callback

  ```js
  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 1
    },
    function(err, resp) {
      if (err) {
        // some code
      }
    }
  )
  ```

* Promise

  ```js
  hemera
    .act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 1
    })
    .catch(err => {
      // some code
    })
  ```

* Async / Await

  ```js
  try {
    await hemera
      .act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 1
      })
  } catch (err) {
  // some code
  }
  ```

## Respond an error

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
