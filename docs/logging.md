---
id: logging
title: Logging
sidebar_label: Logging
---

Hemera use [Pino](https://github.com/pinojs/pino) an extremely fast node.js json logger, inspired by Bunyan. It also includes a shell utility to pretty-print its log files.

## Logging

```js
hemera.log.info('fooBar')
hemera.log.error('fooBar')

hemera.act(
  {
    topic: 'a',
    cmd: 'a'
  },
  function(err, resp) {
    this.log.error(err)
  }
)
```

## Pretty logs

Pretty logging is disabled by default but you can enable it with `prettyLog` option. Before you can use it you have install the [`pino-pretty`](https://github.com/pinojs/pino-pretty) package.

```
npm install --save-dev pino-pretty
```

```js
const hemera = new Hemera(nats, {
  logLevel: 'info',
  prettyLog: true
})
// or
const hemera = new Hemera(nats, {
  logLevel: 'info',
  prettyLog: {} // pino-pretty options
})
```

## Attach tracing information to each log

This will add tracing and request informations to each log.

```js
const hemera = new Hemera(nats, {
  logLevel: 'info',
  traceLog: true
})
```

## Configure log level

```js
const hemera = new Hemera(nats, {
  logLevel: 'info'
})
```

## Log levels

- info
- warn
- debug
- trace
- error
- fatal

## Child logger

The default logger provide a function to create child loggers. This is used inside Hemera to create a logger context inside plugins.

```js
hemera.log.child({ plugin: 'foo' }).info('test')
```

## Pass custom stream

This is useful for debugging and to implement your own serializer.

```js
const split = require('split2')
const stream = split(JSON.parse)
const hemera = new Hemera(nats, {
  logLevel: 'info',
  logger: stream
})
stream.once('data', line => {
  // some code
})
hemera.log.info('test')
```

## Use you own logger

You can pass your own logger but it must implement all [log levels](#log-levels) and the [child logger](#child-logger) function.

```js
const split = require('split2')
const stream = split(JSON.parse)
const hemera = new Hemera(nats, {
  logger: {
    info: function() {},
    child: function() {
      return this
    }
  }
})
hemera.log.info('test')
```
