# Hemera-stats package

[![npm](https://img.shields.io/npm/v/hemera-stats.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-stats)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

Provide informations about process stats and registered actions of all hemera instances. This is a broadcast operation.

**Schema extraction only works with the Joi validator**

Use cases:

* Get a list of all hemera instances and watch the internal behaviour (Memory, V8 internals, Environment, App-Name, Uptime)
* Get a list of all registered server actions and create an API Documentation
* Get a list of all registered server actions and create a realtime dashboard

If you want to get a list of all active subscriber, connections you can use the [NATS HTTP Interface](http://nats.io/documentation/server/gnatsd-monitoring/) it will respond a JSON object.

## Example

```js
'use strict'
const Hemera = require('nats-hemera')
const HemeraStats = require('hemera-stats')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  load: {
    process: {
      sampleInterval: 100
    }
  }
})

hemera.use(HemeraStats)
hemera.ready(() => {
  let Joi = hemera.joi

  hemera.add(
    {
      topic: 'math',
      cmd: 'add',
      a: Joi.number()
        .required()
        .default(33)
        .description('this key will match anything you give it')
        .notes(['this is special', 'this is important'])
        .example(1)
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )

  hemera.act(
    {
      topic: 'stats',
      cmd: 'processInfo'
    },
    function(err, resp) {
      console.log(err, resp)
    }
  )

  hemera.act(
    {
      topic: 'stats',
      cmd: 'registeredActions'
    },
    function(err, resp) {
      console.log(err, resp)
    }
  )
})
```

# Monitoring

* [Monitoring API](#monitoring-api)
  * [Process Info](#process-info)
  * [Registered actions](#registered-actions)

---

## Process Info

You will reveive informations from all hemera instances which has activated this plugin.

The pattern is:

* `topic`: is the topic name to publish to `stats`
* `cmd`: is the command to execute `processInfo`

Example:

```js
hemera.act({
  topic: 'stats',
  cmd: 'processInfo'
}, function(err, resp) ...)
```

Result:

```js
{ app: 'hemera-d1ce3ef6834eeac1',
  eventLoopDelay: 3.487878993153572,
  heapUsed: 12137328,
  rss: 32841728,
  nodeEnv: 'development',
  uptime: 0.193,
  ts: 1488632377418 }
```

---

## Registered actions

You will reveive informations from all hemera instances which has activated this plugin.

The pattern is:

* `topic`: is the topic name to publish to `stats`
* `cmd`: is the command to execute `registeredActions`

Example:

```js
hemera.act({
  topic: 'stats',
  cmd: 'registeredActions'
}, function(err, resp) ...)
```

Result:

```js
{
    "app": "hemera-97b748fab6b5d34b",
    "actions": [{
        "pattern": {
            "topic": "math",
            "cmd": "add"
        },
        "schema": {
            "a": {
                "description": "this key will match any number you give it",
                "notes": ["this is special", "this is important"],
                "tags": [],
                "default": 33,
                "required": true,
                "examples": [1]
            }
        },
        "plugin": "core",
        "ts": 1488632377418
    }]
}
```
