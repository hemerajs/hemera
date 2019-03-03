---
id: version-5.5.0-error-event
title: Response error events
sidebar_label: Events
original_id: error-event
---

You can listen to error events.

```js
const hemera = new Hemera(nats, { logLevel: 'info' })
hemera.on('serverResponseError', function(error) {})
hemera.on('clientResponseError', function(error) {})
```
