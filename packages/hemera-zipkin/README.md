# Hemera-zipkin package

[![npm](https://img.shields.io/npm/v/hemera-zipkin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Zipkin](http://zipkin.io/) with Hemera.

<p align="center">
<img src="https://github.com/hemerajs/hemera/blob/master/packages/hemera-zipkin/media/zipkin-dependency-graph.PNG" style="max-width:100%;">
</p>

## Tracking level

1. Per subscription: Each topic represents a subscription in NATS and therefore handled as own service. The hemera `tag` indentifiy the server instance.
2. Per hemera instance: Each hemera instance represents the whole service. The service name can be configured by the `tag` option.

## Install

```
npm i hemera-zipkin --save
```

## Getting started
Run zipkin in docker
```bash
$ docker-compose up
```
You can then navigate to http://localhost:9411 to access the Zipkin UI.

## Usage

```js
const hemera = new Hemera(nats, {
  logLevel: 'debug',
  childLogger: true,
  tag: 'user-service'
})

hemera.use(hemeraZipkin, {
  debug: false,
  host: '127.0.0.1',
  port: '9411',
  path: '/api/v1/spans',
  subscriptionBased: true, // when false the hemera tag represents the service otherwise the NATS topic name
  sampling: 1
})
```

## Add contextual data
Look in the [documentation](https://hemerajs.github.io/hemera/1_delegate.html) to learn more about delegate in hemera.

```js
hemera.add({
  topic: 'profile',
  cmd: 'get'
}, function (req, cb) {
  this.delegate$.query = 'SELECT FROM User;'
  cb(null, true)
})
```

## Advanced example
[here](/examples/monitoring/zipkin.js)

