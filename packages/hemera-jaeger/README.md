# Hemera-jaeger package

[![npm](https://img.shields.io/npm/v/hemera-jaeger.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jaeger)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Jaeger](http://jaeger.readthedocs.io/en/latest/) tracer with Hemera.

https://eng.uber.com/distributed-tracing/

## Install

```
npm i hemera-opentracing --save
```

## Getting started
Run the [Jaeger tracer](http://jaeger.readthedocs.io/en/latest/)
```bash
$ docker run -d -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 -p5775:5775/udp -p6831:6831/udp -p6832:6832/udp -p5778:5778 -p16686:16686 -p14268:14268 -p9411:9411 jaegertracing/all-in-one:latest
```
You can then navigate to http://localhost:16686 to access the Jaeger UI.

## Usage

```js
hemera.use(hemeraOpentracing, {
  serviceName: 'math'
})
```

## Add contextual data
Loot in the [documentation](https://hemerajs.github.io/hemera/1_delegate.html) to learn more about delegate in hemera.

```js
hemera.use(hemeraOpentracing, {
  serviceName: 'math',
  delegateTags: [
    {
      key: 'query',
      tag: 'hemera.db.query'
    }
  ]
})
```

## Advanced example
[here](/examples/monitoring/jaeger.js)
