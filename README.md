# Hemera

A [Node.js](http://nodejs.org/) microservices toolkit for the [NATS messaging system](https://nats.io)..

- __Status:__ Experimental

## Getting Started


### Prerequisites

[NATS messaging system](https://nats.io)

### Example

```js
'use strict';

const Hemera = require('./lib');
const nats = require ('nats').connect("nats://root:root@localhost:6242");

const hemera = new Hemera({ nats });

/**
 * Your Implementations
 */
hemera.add({ topic: 'math', cmd: 'add' }, (resp) => {

  return resp.a + resp.b;
})

hemera.add({ topic: 'math', cmd: 'sub' }, (resp) => {

  return resp.a - resp.b;
})

/**
 * Call them
 */
hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, (resp) => {
  
  console.log('Result', resp);
});

hemera.act({ topic: 'math', cmd: 'sub', a: 1, b: 20 }, (resp) => {
  
  console.log('Result', resp);
});

hemera.act({ topic: 'math', cmd: 'sub', a: 100, b: 20 }, (resp) => {
  
  console.log('Result', resp);
});
```

### TOOD

- Error handling
- Protocol interface
- API Documentation
- Tests

### Installing

```
npm install
```


## Running the tests


```
npm run test
```

## Built With

* [Rx](https://github.com/Reactive-Extensions/RxJS) - Reactive Extension
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

## Motivation

You shouldn't care about where you app lives, whether you data will arrive or they are scaled.
Let me dreaming :)

## Inspiration

[Seneca](https://github.com/senecajs/seneca) - A microservices toolkit for Node.js.
