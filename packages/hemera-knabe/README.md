# Hemera-knabe package

[![npm](https://img.shields.io/npm/v/hemera-knabe.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-knabe)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

Collect a report about your service dependencies and send it to pattern `topic:knabe` (default).

## Usage

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-knabe'))
hemera.ready(() => {
  hemera.add(`topic:knabe`, req => console.log(req))
  hemera.sendKnabeReport()
})
```

## Report

```js
{
  "dependencies": ["math", "knabe"], // array of topics
  "node": {
    "name": "hemera-starptech-40ec88eebf6848009db7597ed0309512", // config.name
    "tag": "" // config.tag
  }
}
```
