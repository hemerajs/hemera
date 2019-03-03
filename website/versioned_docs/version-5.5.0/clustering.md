---
id: version-5.5.0-clustering
title: Clustering
sidebar_label: Clustering
original_id: clustering
---

For more information see [Clustered Usage](https://github.com/nats-io/node-nats#clustered-usage). Since node-nats `>0.7.18` the Discovered Servers Api is supported. It allows the client to discover new servers without to restart.

```js
const servers = [
  'nats://nats.io:4222',
  'nats://nats.io:5222',
  'nats://nats.io:6222'
]
const nc = nats.connect({ servers: servers })
new Hemera(nc)
```
