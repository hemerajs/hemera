# Hemera-opentracing package

[![npm](https://img.shields.io/npm/v/hemera-opentracing.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [Opentracing](http://opentracing.io/) with Hemera.

# Run Jaeger

```bash
$ docker run -d -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 -p5775:5775/udp -p6831:6831/udp -p6832:6832/udp -p5778:5778 -p16686:16686 -p14268:14268 -p9411:9411 jaegertracing/all-in-one:latest
```
You can then navigate to http://localhost:16686 to access the Jaeger UI.
