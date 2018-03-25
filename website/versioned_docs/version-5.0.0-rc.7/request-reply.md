---
id: version-5.0.0-rc.7-request-reply
title: Request and Reply
sidebar_label: Request & Reply
original_id: request-reply
---

NATS supports two flavors of request reply messaging: point-to-point or one-to-many. Point-to-point involves the fastest or first to respond. In a one-to-many exchange, you set a limit on the number of responses the requestor may receive. In a request-response exchange, publish request operation publishes a message with a reply subject expecting a response on that reply subject. You can request to automatically wait for a response inline. The request creates an INBOX-channel and performs a request call with the inbox reply and returns the first reply received. This is optimized in the case of multiple responses.

## Request (point-to-point)

Hemera using queue groups by default. All subscribers with the same queue name form the queue group. In Hemera a group name is the name of the topic. As messages on the registered subject are published, one member of the group is chosen randomly to receive the message. Although queue groups have multiple subscribers, each message is only consumed by only one. This allows us to load-balancing the traffic by NATS.

## NATS Queueing

This is the default method to start a request. The INBOX-channel is automatically closed after the response.

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

## Receive multiple messages

This allows you to receive multiple messages (in this case 10). If you don't receive 10 messages the INBOX channel is still open and you have to close it manually.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req) {
    this.reply(req.a + req.b)
  }
)

hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    maxMessages$: 10
  },
  function(err, resp) {
    // You can receive 10 messages but also need 10 responses

    // if you receive only 5 you have to close it
    this.remove(this.sid)
  }
)
```

## Receive at least N messages

This ensures that you have to receive at least N responses (in this case 5) within the timeout (default 2000) before a timeout error is thrown and the INBOX-channel is unsubscribed. You can't receive more than expected messages the INBOX-channel is closed automatically.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req) {
    this.reply(req.a + req.b)
  }
)

hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    expectedMessages$: 5
  },
  function(err, resp) {
    // You have to receive 5 responses
  }
)
```

## Receive unknown count of messages

This allows you to receive an unknown count of messages but be aware that you are responsible to close the INBOX-channel.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add'
  },
  function(req) {
    this.reply(req.a + req.b)
  }
)

hemera.act(
  {
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 1,
    maxMessages$: -1
  },
  function(err, resp) {
    // close it anytime
    this.remove(this.sid)
  }
)
```

## Reply anything

You can reply any value even primitive values like `true`, `1`, `5.0`. The first argument expect an error object.

```js
hemera.add({
  topic: "math",
  cmd: "add",
}, function (req, cb) {
  cb(null, req.a + req.b)
})
```

## Auto-unsubscribe

The INBOX-channel of your request-reply action is automatically closed when the expected number of messages is reached, the maximum messages are proceed or the timeout is reached.

```js
hemera.add(
  {
    topic: 'math',
    cmd: 'add',
    maxMessages$: 10,
    expectedMessages$: 5,
    timeout$: 2000
  },
  function(req, cb) {
    cb(null, req.a + req.b)
  }
)
```

## Async / Await

You can also pass an async function.

```js
hemera.add({
  topic: "math",
  cmd: "add"
}, async function (req) {
  return await req.a + req.b
})

let resp = await hemera.act({
  topic: "math",
  cmd: "add"
})

resp.data // response data
resp.context // the parent context to retain meta and trace informations

resp = await resp.context.act(...)
```
