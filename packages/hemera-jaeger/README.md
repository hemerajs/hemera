# Hemera-jaeger package

[![npm](https://img.shields.io/npm/v/hemera-jaeger.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jaeger)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Jaeger](http://jaeger.readthedocs.io/en/latest/) tracer with Hemera.

https://eng.uber.com/distributed-tracing/

## Usage

```js
hemera.use(hemeraJaeger, {
  // See schema https://github.com/jaegertracing/jaeger-client-node/blob/master/src/configuration.js#L37
  config: {
    serviceName: 'math',
    sampler: {
      type: 'const',
      param: 1
    },
    reporter: {
      logSpans: true
    }
  },
  // See options https://github.com/jaegertracing/jaeger-client-node/blob/master/src/configuration.js#L192
  options: {
    logger: {
      info: function logInfo(msg) {
        console.log('INFO ', msg)
      },
      error: function logError(msg) {
        console.log('ERROR', msg)
      }
    }
  }
})
```

## Getting started

Run the [Jaeger tracer](http://jaeger.readthedocs.io/en/latest/)

```bash
$ docker run -d -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 -p5775:5775/udp -p6831:6831/udp -p6832:6832/udp -p5778:5778 -p16686:16686 -p14268:14268 -p9411:9411 jaegertracing/all-in-one:latest
```

You can then navigate to http://localhost:16686 to access the Jaeger UI.

## Build parent context manually

```js
const tracer = hemera.jaeger.tracer

// trace parent request
const span = tracer.startSpan('http_request')
// enrich the span with metadata
span.setTag(KEY, VALUE)
// set the parent span on the context to pass it to all calls
hemera.context$.opentracing = span
// send it to jaeger
span.finish()

hemera.act({
  topic: 'math',
  cmd: 'add'
})
```

## Build parent context with HTTP headers format

```js
const tracer = hemera.jaeger.tracer

/**
 * {
 *     'x-b3-traceid': '123abc',
 *     'x-b3-spanid': '456def',
 *     'x-b3-parentspanid': 'zzzzz',
 *     'x-b3-sampled': '1',
 *     'x-b3-flags': '1'
 *   }
 **/

// trace parent request
const span = tracer.extract(FORMAT_HTTP_HEADERS, req.headers)
// set the parent span on the context to pass it to all calls
hemera.context$.opentracing = span
// send it to jaeger
span.finish()

hemera.act({
  topic: 'math',
  cmd: 'add'
})
```

## Plugin decorators

- .jaeger
Represent an object with following properties
  - tracer: The jaeger tracer instance

## Caveats

- The jaeger tracer generates it's own tracing data.
- This plugin transfers the tracing context in `trace$.opentracing` property.
- Client and Server response errors are logged as `error` events.

## Advanced example

[here](/examples/monitoring/jaeger.js)
