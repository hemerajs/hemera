# Hemera

[![License MIT](https://img.shields.io/npm/l/express.svg)](http://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/StarpTech/hemera.svg?branch=master)](https://travis-ci.org/StarpTech/hemera)
[![NPM Downloads](https://img.shields.io/npm/dt/hemera.svg?style=flat)](https://www.npmjs.com/package/@starptech/hemera)
[![Coverage Status](https://coveralls.io/repos/github/StarpTech/hemera/badge.svg?branch=master)](https://coveralls.io/github/StarpTech/hemera?branch=master)

A [Node.js](http://nodejs.org/) microservices toolkit for the [NATS messaging system](https://nats.io)

> The simplicity and focus of NATS enables it to deliver superior performance and stability with a lightweight footprint. It has the potential of becoming the de-facto transport for microservice architectures and event driven systems in this new era.

Asim Aslam, Creator of Micro

> "I discovered NATS for its performance, and stayed for its simplicity. It’s been a wonderfully reliable layer that connects our microservice architecture at Pressly. The source is easily readable and approachable, and the future developments keep me excited!

Peter Kieltyka - CTO, Pressly

- __Status:__ Experimental

## Getting Started

Hemera is a small wrapper around the nats driver. We want to provide a toolkit to develop microservices in an easy and powerful way. We use bloom filters to provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful. The first goal is to provide a robust implementation for all basic operations. This implicit request reply mechanism, error handling, timeout handling, logging and more...

### Prerequisites

[NATS messaging system](https://nats.io)

We use the Request Reply concept to realize this toolkit. [Request Reply](http://nats.io/documentation/concepts/nats-req-rep/)

### Example

```js
'use strict';

const nats = require('nats').connect(authUrl);
    
const hemera = new Hemera({
  timeout: 200,
  debug: true
});

hemera.useTransport(nats);

hemera.ready(() => {

  /**
  * Your Implementations
  */
  hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {

    cb(null, resp.a + resp.b);
  });

  hemera.add({ topic: 'math', cmd: 'sub' }, (resp, cb) => {

    cb(null, resp.a - resp.b);
  });

  hemera.add({ topic: 'email', cmd: 'send' }, (resp, cb) => {

    cb();
  })

  /**
  * Call them
  */
  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2, $timeout: 5000 }, (err, resp) => {
    
    console.log('Result', resp);
  });

  hemera.act({ topic: 'math', cmd: 'sub', a: 1, b: 20 }, (err, resp) => {
    
    console.log('Result', resp);
  });

  hemera.act({ topic: 'math', cmd: 'sub', a: 100, b: 20 }, (err, resp) => {
    
    console.log('Result', resp);
  });

  //Without callback
  hemera.act({ topic: 'email', cmd: 'send', email: 'foobar@mail.com', msg: 'Hi' });

});
```

### API

Request:
```
act({ topic: '<name>', pattern... }, callback)

topic: `Required` The name of the subscription topic.
```

Reply:
```
add({ topic: '<name>', pattern... }, callback)

topic: `Required` The name of the subscription topic.
```

### NATS Limits & features
[http://nats.io/documentation/faq/](http://nats.io/documentation/faq/)


### TODO

- Error handling
- Protocol specification
- Transport interface
- API Documentation
- Tests
- Logging

### Installing

```
npm install hemera
```


## Running the tests


```
npm run test
```

## Monitoring

Easy and beauitiful tool to monitor you app. [natsboard](https://github.com/fatihcode/natsboard)

## Built With

* [Bloomrun](https://github.com/mcollina/bloomrun) - A js pattern matcher based on bloom filters
* [Node Nats Driver](https://github.com/nats-io/node-nats) - Node.js client for NATS, the cloud native messaging system.

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Dustin Deus** - *Initial work* - [StarpTech](https://github.com/StarpTech)

See also the list of [contributors](https://github.com/StarpTech/hemera/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Inspiration

[Seneca](https://github.com/senecajs/seneca) - A microservices toolkit for Node.js.
