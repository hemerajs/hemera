---
id: version-5.1.0-publish-susbcribe
title: Publish and Subscribe
sidebar_label: Publish & Subscribe
original_id: publish-susbcribe
---

NATS implements a publish subscribe message distribution model. NATS publish subscribe is a one-to-many communication. A publisher sends a message on a subject. Any active subscriber listening on that subject receives the message. Subscribers can register interest in wildcard subjects. In an asynchronous exchange, messages are delivered to the subscriber’s message handler. If there is no handler, the subscription is synchronous and the client may be blocked until it can process the message.

## Normal (one-to-many)

You can send a message with publish and subscribe semantic with the `pubsub$` property.

```js
//Subscribe
hemera.add(
  {
    pubsub$: true,
    topic: 'math',
    cmd: 'add'
  },
  function(req) {}
)

//Publish
hemera.act({
  pubsub$: true,
  topic: 'math',
  cmd: 'add'
})
```

## Special - one-to-one

We are able to publish messages without to create an INBOX in NATS. We can publish messages to the specific queue group math so only one subscriber will proceed the message. This has big performance benefits in comparison with the request-reply model.

```js
//Subscribe
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req) {}
)

//Publish
hemera.act({
  pubsub$: true,
  topic: 'math',
  cmd: 'add'
})
```

## Auto-unsubscribe after a specific count of messages

```js
hemera.add(
  {
    pubsub$: true,
    topic: 'math',
    cmd: 'add',
    maxMessages$: 1
  },
  function(req, cb) {
    cb(null, req.a + req.b)
  }
)
```

## Async / await

You can also pass an async function.

```js
hemera.add({
  pubsub$: true,
  topic: "math",
  cmd: "add"
}, async function (req) {
  return req.a + req.b
})

let resp = await hemera.act({
  pubsub$: true,
  topic: "math",
  cmd: "add"
})

resp.data // response data
resp.context // the parent context to retain meta and trace informations

resp = await result.context.act(...)
```
