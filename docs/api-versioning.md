---
id: api-versioning
title: Api versioning
sidebar_label: Api versioning
---

At first I recommend you to get more familiar with NATS because it's just a simple pub/sub system. In hemera every service is located by his topic name and a topic in NATS is a subscriber.
If you want to version your service you can represent it in the topic name.

## On service level

```js
hemera.add({
  topic: 'math:v1.0'
})
```

or with wildcards. For more informations see [Nats protocol](https://nats.io/documentation/internals/nats-protocol/).

```js
hemera.add({
  topic: 'math:v1.*'
})
```

## On application level

You can version your service by a different pattern so that your service is always accessible with the same topic. In this way you have the most flexbility because both services can co-exist.

```js
hemera.add({
  topic: 'math',
  cmd: ' add',
  version: '1'
})
```

or with regex:

```js
hemera.add({
  topic: 'math',
  cmd: ' add',
  version: /1\.[0-9]/
})
```

## On server level

Imagine a region `eu-west` should only have access to a specific api version. You can connect the clients with a different NATS server which exposed a restricted set of services. After a certain period of time you can combine both server to a cluster. This use case is very special but possible. You have three options.
