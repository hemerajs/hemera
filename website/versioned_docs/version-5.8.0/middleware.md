---
id: version-5.8.0-middleware
title: Middleware
sidebar_label: Middleware
original_id: middleware
---

Middleware functions are functions that have access to the request object (req), the reply object (reply), and the next middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next. If you pass an error to the next function the lifecycle is aborted and the error is responded.

```js
hemera.add({
  topic: "test",
  cmd: "add"
})
.use(function(req, reply, next) {
  //process request
  next()
})
// Pass an array of middlewares
.use([(req, reply, next) => {
  next()
}])
// This is your server action
.end(function(req) => Promise.resolve(req.a + req.b))
```

## Async / Await

You can also pass an async function.

```js
hemera
  .add({
    topic: 'test',
    cmd: 'add'
  })
  .use(async function(req, reply) {})
  .end(async function(req) {})
```
