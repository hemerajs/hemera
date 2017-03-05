![Hemera](https://github.com/StarpTech/hemera/raw/master/media/hemera-logo.png)

[![License MIT](https://img.shields.io/npm/l/express.svg)](http://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/hemerajs/hemera.svg?branch=master)](https://travis-ci.org/hemerajs/hemera)
[![NPM Downloads](https://img.shields.io/npm/dt/nats-hemera.svg?style=flat)](https://www.npmjs.com/package/nats-hemera)
[![Coverage Status](https://coveralls.io/repos/github/hemerajs/hemera/badge.svg?branch=master&ts=9999)](https://coveralls.io/github/hemerajs/hemera?branch=master)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/hemerajs/hemera)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

A [Node.js](http://nodejs.org/) microservices toolkit for the [NATS messaging system](https://nats.io)

- __Node:__ 4.x, 5.x, 6.x, 7.x
- __Website:__ https://hemerajs.github.io/hemera-site/
- __Lead Maintainer:__ [Dustin Deus](https://github.com/StarpTech)

## 📓 Getting Started

Hemera (/ˈhɛmərə/; Ancient Greek: Ἡμέρα [hɛːméra] "day") is a small wrapper around the NATS driver. NATS is a simple, fast and reliable solution for the internal communication of a distributed system. It chooses simplicity and reliability over guaranteed delivery. We want to provide a toolkit to develop micro services in an easy and powerful way. We use bloom filters to provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful.

With Hemera you have the best of both worlds. Efficient pattern matching to have the most flexibility in defining your RPC's. It doesn't matter where your server or client lives. You can add the same add as many as you want on different hosts to ensure maximal availability. The only dependency you have is a single binary of 7MB. Mind your own business NATS do the rest for you:

The key features of NATS in combination with Hemera are:
* **Lightweight**: The Hemera core is small as possible and can be extended by extensions or plugins.
* **Service Discovery**: You don't need a service discovery all subscriptions are managed by NATS.
* **Load Balancing**: Requests are load balanced (random) by NATS mechanism of "queue groups".
* **Packages**: Providing reliable and modern plugins to the community.
* **High performant**: NATS is able to handle million of requests per second.
* **Scalability**: Filtering on the subject name enables services to divide work (perhaps with locality) e.g. `topic:auth:germany`. Queue group name allow load balancing of services.
* **Fault tolerance**: Auto-heals when new services are added. Configure cluster mode to be more reliable.
* **Auto-pruning**: NATS automatically handles a slow consumer and cut it off.
* **Pattern driven**: Define the signatures of your RPC's in JSON and use the flexibility of pattern-matching.
* **PubSub**: Hemera supports all features of NATS. This includes wildcards in subjects and normal publish and fanout mechanism.
* **Tracing**: Any distributed system need good tracing capabilities. We provide support for Zipkin a tracing system which manages both the collection and lookup of this data.
* **Monitoring**: Your NATS server can be monitored by cli or a dashboard.
* **Payload validation**: Create your own validator or use existing plugins for Joi and Parambulator.
* **Serialization**: Use JSON, Msgpack or Avro to serialize your data (dynamic or static).
* **Metadata**: Transfer metadata across services or attach contextual data to tracing systems.
* **Dependencies**: NATS is a single binary of 7MB and can be deployed in seconds.

## Packages

The `hemera` repo is managed as a monorepo, composed of multiple npm packages.

| General | Version |
|--------|-------|
| [nats-hemera](https://github.com/hemerajs/hemera/tree/master/packages/hemera) | [![npm](https://img.shields.io/npm/v/nats-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/nats-hemera)
| [hemera-zipkin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-zipkin) | [![npm](https://img.shields.io/npm/v/hemera-zipkin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
| [hemera-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) | [![npm](https://img.shields.io/npm/v/hemera-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-store)
| [hemera-stats](https://github.com/hemerajs/hemera/tree/master/packages/hemera-stats) | [![npm](https://img.shields.io/npm/v/hemera-stats.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-stats)

| Messaging bridges | Version |
|--------|-------|
| [hemera-rabbitmq](https://github.com/hemerajs/hemera/tree/master/packages/hemera-rabbitmq) | [![npm](https://img.shields.io/npm/v/hemera-rabbitmq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rabbitmq)
| [hemera-nsq](https://github.com/hemerajs/hemera/tree/master/packages/hemera-nsq) | [![npm](https://img.shields.io/npm/v/hemera-nsq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-nsq)

| Database adapter | Version |
|--------|-------|
| [hemera-arango-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-arango-store) | [![npm](https://img.shields.io/npm/v/hemera-arango-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-arango-store)
| [hemera-sql-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-sql-store) | [![npm](https://img.shields.io/npm/v/hemera-sql-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sql-store)
| [hemera-elasticsearch](https://github.com/hemerajs/hemera/tree/master/packages/hemera-elasticsearch) | [![npm](https://img.shields.io/npm/v/hemera-elasticsearch.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-elasticsearch)
| [hemera-couchbase-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-couchbase-store) | [![npm](https://img.shields.io/npm/v/hemera-couchbase-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-couchbase-store)
| [hemera-mongo-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-mongo-store) | [![npm](https://img.shields.io/npm/v/hemera-mongo-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-mongo-store)

| Payload validation | Version |
|--------|-------|
| [hemera-joi](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi) | [![npm](https://img.shields.io/npm/v/hemera-joi.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-joi)
| [hemera-parambulator](https://github.com/hemerajs/hemera/tree/master/packages/hemera-parambulator) | [![npm](https://img.shields.io/npm/v/hemera-parambulator.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-parambulator)

| Data serialization | Version |
|--------|-------|
| [hemera-msgpack](https://github.com/hemerajs/hemera/tree/master/packages/hemera-msgpack) | [![npm](https://img.shields.io/npm/v/hemera-msgpack.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-msgpack)
| [hemera-avro](https://github.com/hemerajs/hemera/tree/master/packages/hemera-avro) | [![npm](https://img.shields.io/npm/v/hemera-avro.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-avro)

| Cache | Version |
|--------|-------|
| [hemera-redis-cache](https://github.com/hemerajs/hemera/tree/master/packages/hemera-redis-cache) | [![npm](https://img.shields.io/npm/v/hemera-redis-cache.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-redis-cache)

| Granting / Authenticating | Version |
|--------|-------|
| [hemera-jwt-auth](https://github.com/hemerajs/hemera/tree/master/packages/hemera-jwt-auth) | [![npm](https://img.shields.io/npm/v/hemera-jwt-auth.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jwt-auth)

Table of contents
=================

  * [Prerequisites](#prerequisites)
  * [Installing](#installing)
  * [Example](#example)
  * [Writing an application](#writing-an-application)
    * [Define your service](#define-your-service)
    * [Call your service](#call-your-service)
  * [Pattern matching rules](#pattern-matching-rules)
      * [Matched!](#Matched!)
      * [Not matched!](#not-matched)
      * [Regex](#regex)
  * [Error handling](#error-handling)
      * [Reply an error](#reply-an-error)
      * [Error-first-callbacks](#error-first-callbacks)
      * [Handle timeout errors](#handle-timeout-errors)
      * [Fatal errors](#fatal-errors)
      * [Error propagation](#error-propagation)
      * [Listen on response errors](#listen-on-response-errors)
      * [Listen on transport errors](#listen-on-transport-errors)
      * [Specify custom timeout per act](#specify-custom-timeout-per-act)
  * [Delegation](#delegation)
      * [Metadata](#metadata)
      * [Context](#context)
      * [Delegate](#delegate)
  * [Extension points](#extension-points)
      * [Client](#client-extensions)
      * [Server](#server-extensions)
  * [Middleware](#middleware)
      * [Server methods](#server-methods)
  * [Tracing capabilities](#tracing-capabilities)
      * [Life-cycle events](#requestresponse-life-cycle-events)
  * [Publish & Subscribe](#publish--subscribe)
  * [Payload validation](#payload-validation)
  * [Plugins](#plugins)
    * [Create a plugin](#create-a-plugin)
    * [Plugin registration](#plugin-registration)
  * [Logging](#logging)
  * [Protocol](#protocol)
  * [Api Versioning](#api-versioning)
  * [Best practice](#best-practice)
      * [Multiple instances of your service](#create-multiple-instances-of-your-service)
      * [Clustering](#create-another-nats-server-and-create-a-cluster)
      * [Docker](#docker)
  * [Introduction to NATS](#introduction-to-nats)
  * [NATS Limits & features](#nats-limits--features)
  * [Bridge to other messaging systems](#bridge-to-other-messaging-systems)
  * [Monitoring](#monitoring)
  * [Nginx integration for NATS](#nginx-integration-for-nats)
  * [Contributing](#contributing)
  * [Inspiration](#inspiration)

### Prerequisites

[NATS messaging system](https://nats.io)

We use the Request Reply concept to realize this toolkit. [Request Reply](http://nats.io/documentation/concepts/nats-req-rep/)

### Installing

[![NPM stats](https://nodei.co/npm/nats-hemera.png?downloads=true)](https://www.npmjs.org/package/nats-hemera)

### Example

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect(authUrl)
    
const hemera = new Hemera(nats, { logLevel: 'info' })

hemera.ready(() => {


  hemera.add({ topic: 'math', cmd: 'add' }, (req, cb) => {

    cb(null, req.a + req.b)
  })

  hemera.add({ topic: 'email', cmd: 'send' }, (req, cb) => {

    cb()
  })


  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2, timeout$: 5000 }, (err, resp) => {
    
    console.log('Result', resp)
  })

  //Without callback
  hemera.act({ topic: 'email', cmd: 'send', email: 'foobar@mail.com', msg: 'Hi' })

})
```

### Writing an application

_Add_: Define you implementation.

_Act_: Start a request

_Topic_: The subject to subscribe. **The smallest unit of Hemera**. It's kind of namespace for your service. If you want to scale your service you have to create a second instance of your service. If you just want to scale a method you have to subscribe to a different subject like `math:additions` because any subscriber have to contain the full implementation of the service otherwise you can run into a `PatternNotFound` exception.

#### Define your service
```js
hemera.add({ topic: 'math', cmd: 'add' }, (req, cb) => {
  cb(null, req.a + req.b)
})
```

#### Call your service
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
console.log(resp) //2
})
```

### Pattern matching rules

A match happens when all properties of added pattern matches with the one in the passed object.

#### Matched!
```js
hemera.add({ topic: 'math', cmd: 'add' }, (req, cb) => {
  cb(resp.a + resp.b)
})
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 })
```
#### Not matched!
```js
hemera.add({ topic: 'math', cmd: 'add', foo: 'bar' }, (req, cb) => {
  cb(req.a + req.b)
})
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 })
```

#### Regex

You can also use regex to express your pattern
```js
hemera.add({ topic: 'math', cmd: 'add', version: /v1\.[0-9]/ }, (req, cb) => {
  cb(req.a + req.b)
})
```

### Error handling

#### Reply an error
```js
hemera.add({ topic: 'math', cmd: 'add' }, (req, cb) => {
  cb(new CustomError('Invalid operation'))
})
```
#### Error-first-callbacks
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
 err instanceOf CustomError // true
})
```
#### Handle timeout errors

NATS is fire and forget, reason for which a client times out could be many things:

- No one was connected at the time (service unavailable)
- Service is actually still processing the request (service takes too long)
- Service was processing the request but crashed (service error)

```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
 err instanceOf TimeoutError // true
})
```
#### Fatal errors
Fatal errors will crash your server. You should implement a gracefully shutdown and use a process watcher like PM2 to come back in a clear state. Optional you can disable this behavior by `crashOnFatal: false`

```js
hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {
  throw new Error('Upps')
})
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
  err instanceOf FatalError // true
})

```

#### Error propagation

If you call a service which internally call many other services and suddenly a service fails, this error must be propagated to the first callee. Hemera will chain all errors together and you are able to access the root issue with

```js
hemera.act({
  topic: 'a',
  cmd: 'a'
}, (err, resp) => {
 const error = err.rootCause
})
```
Errors in the chain you can access with:

```js
hemera.act({
  topic: 'a',
  cmd: 'a'
}, (err, resp) => {
 const error = err.cause
 const error2 = err.cause.cause
 const error3 = err.cause.cause.cause
})
```



#### Listen on response errors
```js
const hemera = new Hemera(nats, { logLevel: 'info' })
hemera.on('serverResponseError', function(error) {})
hemera.on('clientResponseError', function(error) {})
```

#### Listen on transport errors
```js
const hemera = new Hemera(nats, { logLevel: 'info' })
hemera.transport.on('error', function(error) {})
hemera.transport.on('disconnect', function(error) {})
hemera.transport.on('connect', function(error) {})
//see NATS driver for more events
```

#### Specify custom timeout per act
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1, timeout$: 5000 }, (err, resp) => {
})
```

### Delegation
#### _* Notice the use of ```this```_

#### Metadata
If you want to transfer metadata to a service you can use the `meta$` property before sending. It will be passed in all nested `act`.
E.g. you can add a JWT token as metadata to express if your action is legitimate. Data will be transfered!

```js
hemera.add({ topic: 'math', cmd: 'add' }, function (req, cb) {
    
    //Access to metadata
    let meta = this.meta$
    
    cb(null, req.a + req.b)
})
```
Will set the metadata only for this `act` and all nested operations. Data will be transfered!

```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1, meta$: { a: 'test' } }, function (err, resp) {

   this.act({ topic: 'math', cmd: 'add', a: 1, b: 5 })
})
```
Will set the metadata on all `act`. Data will be transfered!

```js
hemera.meta$.token = 'ABC1234'
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1}, function (err, resp) {
    //or
   this.meta$.token = 'ABC1234'

   this.act({ topic: 'math', cmd: 'add', a: 1, b: 5 })
})
```
#### Context
If you want to set a context across all `act` you can use the `context$` property. Data will __not__ be transfered!

```js
hemera.context$.a = 'foobar'
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, function (err, resp) {
   
   this.context$.a // 'foobar'
   
   this.act({ topic: 'math', cmd: 'add', a: 1, b: 5 }, function (err, resp) {
        
       this.context$.a // 'foobar'
   })
})
```
If you want to set a context only for this `act` and all nested `act`

```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1, context$: 1 }, function (err, resp) {
   //or
   this.act({ topic: 'math', cmd: 'add', a: 1, b: 5 }, function (err, resp) {
        
      this.context$ // 1
   })
})
```

#### Delegate
If you want to pass data only to the `add` you can use `delegate$`. This feature is used to transfer contextual data to tracing systems.

```js
hemera.act({ topic: 'math', cmd: 'add', delegate$: { foo: 'bar' } })

hemera.add({
  topic: 'math',
  cmd: 'add',
}, function (req, cb) {

  cb()

})

hemera.add({
  topic: 'math',
  cmd: 'add',
}, function (req, cb) {

  //Visible in zipkin ui
  this.delegate$.query = 'SELECT FROM User;'

})
```
### Extension points
You can extend custom behavior by extensions.

#### Client extensions
* `onClientPreRequest`,
* `onClientPostRequest`

`i` s the index of the handler

```js
hemera.ext('<client-extension>', function(next, i) {
   
   let ctx = this
   next(<error>)
})
```

#### Server extensions

Server extensions are functions that have access to the request object (req), the response object (res), and the next extension function in the global application’s request-response cycle. You have access of the previous value of the extension function.

* `onServerPreHandler`,
* `onServerPreRequest`
* `onServerPreResponse`

```js
hemera.ext('<server-extension>', function (req, res, next, prevValue, i) {
   
   next(<error>)
   //res.send(<payload>)
   //res.end(<payload>)
})
```

* `next()` will call the next extension handler on the stack.
* `res.send(<error> or <payload>)` will end the request-response cycle and send the data back to the callee but __other__ extensions will be called.
* `res.end(<error> or <payload>)` will end the request-response cycle and send the data back to the callee but __no__ other extensions will be called.
* `req` contains the current request. Its an object with two properties `payload` and `error` because decoding issues. Payload and error object can be manipulated.
* `res`  contains the current response. Its an object with two properties `payload` and `error`. Payload and error object can be manipulated.
* `prevValue`  contains the message from the previous extension which was passed by `send(<value>)`
* `i`  represent the position of the handler in the stack.

### Middleware

Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next. If you pass an error to the next function the error will be responded.

#### Server methods

```js
hemera.add({
  topic: 'test',
  cmd: 'add'
}).use(function(req, resp, next) {
  //process request
  next()
})
.use(function(req, resp, next) {
  //process request
  next()
})
.end(function(req, cb) {
  cb(null, true)
})
```

### Tracing capabilities
Tracing in the style of [Google’s Dapper](http://static.googleusercontent.com/media/research.google.com/en//pubs/archive/36356.pdf)

In any act or add you can access the property `this.request$` or `this.trace$` to get information about your current or parent call.

```js
    meta: {}
    trace: {
      "traceId": "CRCNVG28BUVOBUS7MDY067",
      "spanId": "CRCNVG28BUVOLJT4L6B2DW",
      "timestamp": 887381084442,
      "duration": 10851,
      "service": "math",
      "method": "a:1,b:20,cmd:add,topic:math"
    }
    request: {
      "id": "CRCNVG28BUVONL3P5L76AR",
      "timestamp": 887381084459,
      "duration": 10851,
      "pattern": "a:1,b:20,cmd:add,topic:math"
    }
    result: 50
```

#### Request/response life-cycle events

Events:
* `clientPreRequest`,
* `clientPostRequest`
* `serverPreHandler`,
* `serverPreRequest`
* `serverPreResponse`

```js
hemera.on('<event>', () => {
  const ctx = this
})
```

Times are represented in nanoseconds.

### Publish & Subscribe

#### Normal (One-to-many)

```js
  //Subscribe
  hemera.add({
    pubsub$: true,
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  }, (req) => {

  })
  //Publish
  hemera.act({
    pubsub$: true,
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  })
```

#### Special - one-to-one (but with queue group names)

```js
  //Subscribe
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  }, (req) => {

  })
  //Publish
  hemera.act({
    pubsub$: true,
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  })
```

### Payload validation
You can use different validators e.g [Joi example](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi)

```js
hemera.add({
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  }, (req, cb) => {

    cb(null, {
      result: req.a + req.b
    })
  })
```
Handling
```js
hemera.act({ topic: 'math', cmd: 'add', a: '1' }, function (err, resp) {
        
   err instanceOf PayloadValidationError //true
})
```
### Plugins

You can create a plugin in two different ways:

#### Create a plugin

If you want to create a plugin which can be required and passed to the `use` function.

```js
exports.plugin = function myPlugin (options) {
  var hemera = this
  
  //Expose data which you can access globally with hemera.exposition.<pluginName>.<property>
  hemera.expose('magicNumber', 42)

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
}

exports.options = {}

exports.attributes = {
  pkg: require('./package.json')
}
```

If you want to create a plugin without to swap it out in a seperate file.
```js
let myPlugin = function (options) {

  let hemera = this
  
  //Expose data which you can access globally with hemera.exposition.<pluginName>.<property>
  hemera.expose('magicNumber', 42)

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {

    cb(null, {
      result: req.a + req.b
    })
  })

}

hemera.use({ 
 plugin: myPlugin,
 options: {},
 attributes: { 
  name: 'test',
  version: '1.0.0',
  description: 'my first plugin'
 }
})
```

#### Plugin registration

A plugin must be registered before the `ready` function is called. The `ready` function will initialize all plugins.

Variant 1 - pass the plugin as one object. Default plugin options are preserved if you don't overwrite them.

```js
hemera.use({ 
  plugin: function() {},
  attributes: { name: 'foo' },
  options: { a: 1 }
})
```

Variant 2 - Pass plugin options as second argument to the use function. Default plugin options are preserved if you don't overwrite them. 

```js
hemera.use({ 
  plugin: function() {},
  attributes: { name: 'foo' }
}, { a: 1 })
```

### Logging

Hemera used Pino logger by default but you can also use your own [example](https://github.com/hemerajs/hemera/blob/master/examples/custom-logger.js)

Your custom logger have to support following log levels.
```js
['info', 'warn', 'debug', 'trace', 'error', 'fatal']
```

```
[2017-02-04T22:19:34.156Z] INFO (app/2056 on starptech): Connected!
[2017-02-04T22:19:34.160Z] INFO (app/2056 on starptech): ADD - ADDED
    topic: "math"
    cmd: "add"
[2017-02-04T22:19:34.163Z] INFO (app/2056 on starptech):
    outbound: {
      "id": "5ecdad999267f031109df50f653a7f46",
      "pattern": "a:1,b:2,cmd:add,topic:math"
    }
[2017-02-04T22:19:34.167Z] INFO (app/2056 on starptech):
    inbound: {
      "id": "5ecdad999267f031109df50f653a7f46",
      "duration": 0.003826,
      "pattern": "a:1,b:2,cmd:add,topic:math"
    }
```

### Protocol

```
message ErrorCause {
  string message = 1;
  string name = 2;
}

message RootCause {
  string message = 1;
  string name = 2;
}

enum RequestType {
  pubsub = 0;
  request = 1;
}

message Error {
  string message = 1;
  string name = 2;
  Pattern pattern = 3;
  ErrorCause cause = 4;
  RootCause rootCause = 5;
  string ownStack = 6;
}

message Request {
  string id = 1;
  string parentId = 2;
  int64 timestamp = 3;
  int32 duration = 4;
  RequestType type = 5;
}

message Trace {
  string traceId = 1;
  string spanId = 2;
  int64 timestamp = 3;
  string service = 4;
  string method = 5;
  int32 duration = 6;
}

message Pattern = Object;
message Result = Any;
message Delegate = Object;
message Meta = Object;

message Protocol {
    Trace trace = 1;
    Request request = 2;
    Result result = 3;
    Error error = 4;
    Meta meta = 5;
    Delegate delegate = 6;
}
```
## Api Versioning

At first I recommend you to get familiar with NATS https://nats.io/documentation/
NATS is pub/sub system. In hemera every service is located by his topic name. If you want provide a service with different versions you can represent it with the topic name 

***On service level*:**
```js
hemera.add({ topic: "math:v1.0" })
```
or with a wildcard
```js
hemera.add({ topic: "math:v1.*" })
```
Wildcards in Nats: https://nats.io/documentation/internals/nats-protocol/

***On application level***

You can also express you different version with a different pattern so that your service is always accessible via the same topic. I prefer this solution because you have the most flexbility and less effort but this orientates on the complexity of both versions.
```js
hemera.add({
topic: "math",
cmd:" add", 
version: "1"
})
```
or with regex
```js
hemera.add({
topic: "math",
cmd:" add", 
version: /1\.[0-9]/
})
```
***On server level***

E.g different regions should only have access to api version 1.0. You can connect those clients with a different NATS server which exposed a restricted set of services. After a certain period of time you can also combine both server to a cluster. This use case is very special but possible.

You have three options how to deal with versioning.

## Best practice

Think in small parts. A topic is like a service. You can define a service like `auth` which is responsible for authenticate users.

This service has actions like:

```js
hemera.add({ topic: 'auth', cmd: 'authenticate' }, ...)
hemera.add({ topic: 'auth', cmd: 'passwordReset' }, ...)
...
```

### Create multiple instances of your service.

Now your service is scaled.

```js
node service.js
node service.js
```

### Create another NATS Server and create a cluster.

Now your service is fault-tolerant.
```js
var servers = ['nats://nats.io:4222', 'nats://nats.io:5222', 'nats://nats.io:6222'];
var nc = nats.connect({'servers': servers});
new Hemera(nc);
```

### Docker

I prepared a setup how to use hemera in a real world scenario.
https://github.com/hemerajs/aither

### Introduction to NATS

https://www.youtube.com/watch?v=NfL0WO44pqc

### NATS Limits & features
[http://nats.io/documentation/faq/](http://nats.io/documentation/faq/)

### Are you the only one who use NATS for microservice architectures?

> The simplicity and focus of NATS enables it to deliver superior performance and stability with a lightweight footprint. It has the potential of becoming the de-facto transport for microservice architectures and event driven systems in this new era.

Asim Aslam, Creator of Micro

> "I discovered NATS for its performance, and stayed for its simplicity. It’s been a wonderfully reliable layer that connects our microservice architecture at Pressly. The source is easily readable and approachable, and the future developments keep me excited!

Peter Kieltyka - CTO, Pressly

## Running the tests

Set the path to the `gnatsd` before start testing.
```
npm run test
```

## Monitoring

Easy and beautiful tool to monitor you app. [hemera-board](https://github.com/hemerajs/hemera-board)

## Bridge to other messaging systems

If you need message delivery or another guarantee which NATS cannot provide you are able to plugin any other messaging system. E.g we provide plugins for RabbitMQ and NSQ.

![Hemera](https://github.com/StarpTech/hemera/raw/master/media/hemera-rabbitmq-nsq.png)
> We can always build stronger guarantees on top, but we can’t always remove them from below."
Tyler Treat

## Nginx integration for NATS

[nginx-nats](https://github.com/nats-io/nginx-nats)

## Built With

* [Bloomrun](https://github.com/mcollina/bloomrun) - A js pattern matcher based on bloom filters
* [Node Nats Driver](https://github.com/nats-io/node-nats) - Node.js client for NATS, the cloud native messaging system.

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

1. Clone repository
2. `npm install`
3. `lerna bootstrap`
4. Install gnats server and make it accesible in your user path.
5. Run tests `npm run test`

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Dustin Deus** - [StarpTech](https://github.com/StarpTech)

See also the list of [contributors](https://github.com/StarpTech/hemera/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Inspiration

[Seneca](https://github.com/senecajs/seneca) - A microservices toolkit for Node.js.
