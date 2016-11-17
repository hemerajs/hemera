# Hemera
![Hemera](https://github.com/StarpTech/hemera/raw/master/docs/hemera.png)

[![License MIT](https://img.shields.io/npm/l/express.svg)](http://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/StarpTech/hemera.svg?branch=master)](https://travis-ci.org/StarpTech/hemera)
[![NPM Downloads](https://img.shields.io/npm/dt/hemera.svg?style=flat)](https://www.npmjs.com/package/@starptech/hemera)
[![Coverage Status](https://coveralls.io/repos/github/StarpTech/hemera/badge.svg?branch=master)](https://coveralls.io/github/StarpTech/hemera?branch=master)

A [Node.js](http://nodejs.org/) microservices toolkit for the [NATS messaging system](https://nats.io)

- __Status:__ Experimental

## Getting Started

Hemera is a small wrapper around the nats driver. We want to provide a toolkit to develop microservices in an easy and powerful way. We use bloom filters to provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful.

With Hemera you have the best of both worlds. Efficient pattern matching to have the most flexibility in defining your RPC's.
It doesn't matter where your server or client lives. You can add the same `add` as many as you want on different hosts to ensure maximal availability. Thanks to the Request Reply pattern you can work with that as if you do a normal http request. The only dependency you have is a single binary of 7MB. Mind your own business NATS do the rest for you:

- high througput message fanout
- Addressing, discovery
- Command and control (control plane)
- Load balancing
- N-way scalability
- Location transparency
- Fault tolerance

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


  hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {

    cb(null, resp.a + resp.b);
  });

  hemera.add({ topic: 'email', cmd: 'send' }, (resp, cb) => {

    cb();
  })


  hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2, $timeout: 5000 }, (err, resp) => {
    
    console.log('Result', resp);
  });

  //Without callback
  hemera.act({ topic: 'email', cmd: 'send', email: 'foobar@mail.com', msg: 'Hi' });

});
```

### Writing an application

#### Define your service
```js
hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {
  cb(null, resp.a + resp.b);
});
```

#### Call your service
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
console.log(resp); //2
});
```
#### Reply an error
```js
hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {
  cb(new CustomError('Invalid operation'));
});
```
#### Error-first-callbacks
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
 err instanceOf CustomError // true
});
```
#### Handle timeout errors
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
 err instanceOf TimeoutError // true
});
```
#### Fatal errors
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1 }, (err, resp) => {
 throw new Error('Upps');
});
hemera.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {
   err instanceOf FatalError // true
});
```
#### Specify custom timeout per act
```js
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 1, $timeout: 5000 }, (err, resp) => {
});
```

### Logging

```js
const hemera = new Hemera({
  debug: true
});
```

```js
[2016-11-17T21:04:47.608Z] INFO (app/18196 on starptech): ACT
    topic: "math"
    cmd: "add"
    a: 1
    b: 2
[2016-11-17T21:04:47.613Z] INFO (app/18196 on starptech): ACT_RESP
    topic: "math"
    cmd: "add"
    a: 1
    b: 2
    $time: 2
```

### NATS Limits & features
[http://nats.io/documentation/faq/](http://nats.io/documentation/faq/)

### Are you the only one who use NATS for microservice architectures?

> The simplicity and focus of NATS enables it to deliver superior performance and stability with a lightweight footprint. It has the potential of becoming the de-facto transport for microservice architectures and event driven systems in this new era.

Asim Aslam, Creator of Micro

> "I discovered NATS for its performance, and stayed for its simplicity. It’s been a wonderfully reliable layer that connects our microservice architecture at Pressly. The source is easily readable and approachable, and the future developments keep me excited!

Peter Kieltyka - CTO, Pressly

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

## Nginx integration for NATS

[nginx-nats](https://github.com/nats-io/nginx-nats)

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
