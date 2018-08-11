---
id: error-event
title: Response error events
sidebar_label: Events
---

You can listen to error events.

```js
const hemera = new Hemera(nats, { logLevel: 'info' })
hemera.on('serverResponseError', function(error) {})
hemera.on('clientResponseError', function(error) {})
```

### EventEmitter

Hemera is an eventEmitter. If no `error` event is registered an uncaught error is thrown and the process will die but if you register an `error` handler please ensure that you handle all cases correctly. In most cases you should restart the process in oder to combe back in a clear state.

This event is used for asynchronous errors:

- connection is closed before hemera is closed

```js
hemera.on('error', function(error) {})
```
