# Hemera-jaeger package

[![npm](https://img.shields.io/npm/v/hemera-jaeger.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jaeger)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Jaeger](http://jaeger.readthedocs.io/en/latest/) tracer with Hemera.

https://eng.uber.com/distributed-tracing/

## Install

```
npm i hemera-jaeger --save
```

## Getting started
Run the [Jaeger tracer](http://jaeger.readthedocs.io/en/latest/)
```bash
$ docker run -d -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 -p5775:5775/udp -p6831:6831/udp -p6832:6832/udp -p5778:5778 -p16686:16686 -p14268:14268 -p9411:9411 jaegertracing/all-in-one:latest
```
You can then navigate to http://localhost:16686 to access the Jaeger UI.

## Usage

```js
hemera.use(hemeraJaeger, {
  serviceName: 'math'
})
```

## Add contextual data
Look in the [documentation](https://hemerajs.github.io/hemera/1_delegate.html) to learn more about delegate in hemera.

```js
hemera.use(hemeraJaeger, {
  serviceName: 'math',
  delegateTags: [
    {
      key: 'query',
      tag: 'hemera.db.query'
    }
  ]
})
```

## Use different sampler
Default is `Const`. See [here](https://github.com/uber/jaeger-client-node/tree/master/src/samplers) for all samplers.

```js
hemera.use(hemeraJaeger, {
  serviceName: 'math',
  jaeger: {
    sampler: {
      type: 'RateLimiting',
      options: 1
    }
  }
})
```

## Caveats

- This plugin will use the property `hemera.trace$.opentracing` to transfer data across processes.
- Client and Server response errors are logged as `error` events.

## Advanced example
[here](/examples/monitoring/jaeger.js)
