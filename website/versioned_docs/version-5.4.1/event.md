---
id: version-5.4.1-event
title: Events
sidebar_label: Events
original_id: event
---

Hemera is an event emitter. You can listen on lifecycle events.

```js
hemera.on('clientPreRequest', hemera => {})
hemera.on('clientPostRequest', hemera => {})

hemera.on('serverPreHandler', hemera => {})
hemera.on('serverPreRequest', hemera => {})
hemera.on('serverPreResponse', hemera => {})
```
