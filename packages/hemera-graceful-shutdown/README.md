# Hemera-graceful-shutdown package

[![npm](https://img.shields.io/npm/v/hemera-graceful-shutdown.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-graceful-shutdown)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

Shutdown Hemera graceful asynchronously. By default the hemera `onClose` hook is called when `SIGINT` or `SIGTERM` was triggered.

## Usage

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-graceful-shutdown'))
hemera.gracefulShutdown((signal, next) => {
  next()
})
```

## Plugin decorators

* .gracefulShutdown(Function handler)

## Caveats

* Don't register signal handlers otherwise except with this plugin.
* Use hemera `onClose` hook to release resources in your plugin.
* The process will be exited after a certain timeout (Default 10 seconds) to protect against stuck process.
