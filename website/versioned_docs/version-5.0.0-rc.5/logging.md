---
id: version-5.0.0-rc.5-logging
title: Logging
sidebar_label: Logging
original_id: logging
---

Hemera use [Pino](https://github.com/pinojs/pino) an extremely fast node.js logger, inspired by Bunyan. It also includes a shell utility to pretty-print its log files.

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

Pretty logging is enabled by default you can disable it with `prettyLog` option.

```js
const hemera = new Hemera(nats, {
  logLevel: 'info',
  prettyLog: false
})
```

## Configure log level

```js
const hemera = new Hemera(nats, {
  logLevel: 'info'
})
```

## Available log levels

* info
* warn
* debug
* trace
* error
* fatal
