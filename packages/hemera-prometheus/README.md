# Hemera-prometheus
Prometheus collector for Hemera

[![npm](https://img.shields.io/npm/v/hemera-prometheus.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-prometheus)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This client will expose a public metric endpoint on `localhost:3000/metrics`. You can expose more `Counter`, `Gauge` as http endpoint with one command `hemera.exposeMetric('metricName')`. For more informations about the prometheus client look in the driver [documentation](https://github.com/siimon/prom-client).

## Install

```
npm i hemera-prometheus --save
```

## Example

```js
hemera.use(require('hemera-prometheus'))

hemera.ready(() => {
  const c = new hemera.prom.Counter({
    name: 'test_counter',
    help: 'Example of a counter',
    labelNames: ['code']
  })

  hemera.exposeMetric('test_counter') // localhost:3000/metrics/test_counter

  c.inc()

  setInterval(() => c.inc(), 10000)
})
```
