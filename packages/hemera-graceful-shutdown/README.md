# Hemera-graceful-shutdown package

[![npm](https://img.shields.io/npm/v/hemera-joi.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-graceful-shutdown)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

Shutdown Hemera graceful asynchronously. By default the hemera `onClose` hook is called when `SIGINT` or `SIGTERM` was triggered.

## Install
```bash
npm install --save hemera-graceful-shutdown
```

## Register plugin
```js
hemera.use(require('hemera-graceful-shutdown'))
```

## Usage
```js
hemera.gracefulShutdown((signal, next) => {
  next()
})
```

## Caveats

- Don't register signal handlers otherwise except with this plugin.
- Use hemera `onClose` hook to release resources in your plugin.
- The process will be exited after a certain timeout (Default 10 seconds) to protect against stuck process.
