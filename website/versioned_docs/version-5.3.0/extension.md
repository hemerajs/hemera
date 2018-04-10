---
id: version-5.3.0-extension
title: Extension
sidebar_label: Extension
original_id: extension
---

Extensions allow you to listen to specific events in the application or request/response lifecycle. You have to register an extension before the event is triggered otherwise the event is lost.

## Server & Client lifecycle

```js
hemera.ext('onClientPreRequest', function(hemera, next) {
  // some code
  next()
})
hemera.ext('onClientPostRequest', function(hemera, next) {
  // some code
  next()
})

hemera.ext('onServerPreHandler', function(hemera, request, reply, next) {
  // some code
  next()
})
hemera.ext('onServerPreRequest', function(hemera, request, reply, next) {
  // some code
  next()
})
hemera.ext('onServerPreResponse', function(hemera, request, reply, next) {
  // some code
  next()
})
```

## Application lifecycle

```js
hemera.ext('onClose', (hemera, done) => {
  // some code
  done()
})

hemera.ext('onAdd', addDefinition => {
  // some code
  addDefinition.pattern
  addDefinition.schema
  addDefinition.action
  addDefinition.transport
})
```

## Async / Await

You can also pass an async function.

```js
hemera.ext('onServerPreHandler', async function(hemera, request, reply) {
  // some code
})

hemera.ext('onClientPreRequest', async function(hemera) {
  // some code
})
```
