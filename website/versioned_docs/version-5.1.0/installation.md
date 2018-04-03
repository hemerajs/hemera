---
id: version-5.1.0-installation
title: Installation
sidebar_label: Installation
original_id: installation
---

## 1. Install NATS client and Hemera

```bash
npm install nats nats-hemera
```

### Prerequisites

1.  Node higher than `>6`
2.  npm `>=3.x` or yarn
3.  NATS

## 2. Installing NATS

1.  [Download](https://nats.io/download/) NATS
2.  Install the path to the executeable in your user path
3.  Run it!

## Basic Usage

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req, cb) {
      cb(null, req.a + req.b)
    }
  )
  hemera.act(
    {
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    },
    function(err, resp) {
      this.log.info(resp, 'Result')
    }
  )
})
```
