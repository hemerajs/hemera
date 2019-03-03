---
id: version-7.0.0-extension
title: Extension
sidebar_label: Extension
original_id: extension
---

Extensions allow you to listen to specific events in the application or request/response lifecycle. You have to register an extension before the event is triggered otherwise the event is lost.

## Server & Client lifecycle

```js
hemera.ext('onAct', function(hemera, next) {
  // some code
  next()
})
hemera.ext('onActFinished', function(hemera, next) {
  // some code
  next()
})

hemera.ext('preHandler', function(hemera, request, reply, next) {
  // some code
  next()
})
hemera.ext('onRequest', function(hemera, request, reply, next) {
  // some code
  next()
})
hemera.ext('onSend', function(hemera, request, reply, next) {
  // some code
  next()
})
hemera.ext('onResponse', function(hemera, reply, next) {
  // some code
  next()
})
hemera.ext('onError', function(hemera, payload, error, next) {
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
hemera.ext('preHandler', async function(hemera, request, reply) {
  // some code
})
hemera.ext('onAct', async hemera => {
  // some code
})
hemera.ext('onResponse', async function(hemera, reply) {
  // some code
})
hemera.ext('onError', async (hemera, payload, error) => {
  // some code
})
hemera.ext('onClose', async addDefinition => {
  // some code
})
hemera.ext('onAdd', async addDefinition => {
  // some code
})
```
