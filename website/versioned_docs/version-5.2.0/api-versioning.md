---
id: version-5.2.0-api-versioning
title: Api versioning
sidebar_label: Api versioning
original_id: api-versioning
---

At first I recommend you to get more familiar with NATS it is a simple pub/sub system. In hemera every service is located by his topic name.
If you want provide a service with different versions you can represent it in the topic name.

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

You can also express you different version with a different pattern so that your service is always accessible via the same topic. I prefer this solution because you have the most flexbility and less effort but this orientates on the complexity of both versions.

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

Imagine a region `eu-west` should only have access to a specific api version. You can connect those clients with a different NATS server which exposed a restricted set of services. After a certain period of time you can also combine both server to a cluster. This use case is very special but possible. You have three options how to deal with versioning.
