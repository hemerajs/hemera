![Hemera](https://github.com/StarpTech/hemera/raw/master/media/hemera-logo.png)

[![License MIT](https://img.shields.io/npm/l/express.svg)](http://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/hemerajs/hemera.svg?branch=master)](https://travis-ci.org/hemerajs/hemera)
[![NPM Downloads](https://img.shields.io/npm/dt/nats-hemera.svg?style=flat)](https://www.npmjs.com/package/nats-hemera)
[![Coverage Status](https://coveralls.io/repos/github/hemerajs/hemera/badge.svg?branch=master&ts=9999)](https://coveralls.io/github/hemerajs/hemera?branch=master)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/hemerajs/hemera)

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

A [Node.js](http://nodejs.org/) microservices toolkit for the [NATS messaging system](https://nats.io)

- __Node:__ 4.x, 5.x, 6.x, 7.x
- __Documentation:__ https://hemerajs.github.io/hemera/
- __Website:__ https://hemerajs.github.io/hemera-site/
- __Lead Maintainer:__ [Dustin Deus](https://github.com/StarpTech)

## 📓 Getting Started

Hemera (/ˈhɛmərə/; Ancient Greek: Ἡμέρα [hɛːméra] "day") is a small wrapper around the NATS driver. NATS is a simple, fast and reliable solution for the internal communication of a distributed system. It chooses simplicity and reliability over guaranteed delivery. We want to provide a toolkit to develop micro services in an easy and powerful way. We use bloom filters to provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful.

With Hemera you have the best of both worlds. Efficient pattern matching to have the most flexibility in defining your RPC's. It doesn't matter where your server or client lives. You can add the same add as many as you want on different hosts to ensure maximal availability. The only dependency you have is a single binary of 7MB. Mind your own business NATS do the rest for you:

The key features of NATS in combination with Hemera are:
* **Lightweight**: The Hemera core is small as possible and can be extended by extensions or plugins.
* **Location transparency**: A service may be instantiated in different locations at different times. An application interacting with an service and does not know the service physical location.
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

## What Hemera code looks like

```js
const Hemera = require('nats-hemera')
const HemeraJoi = require('hemera-joi')
const nats = require('nats').connect(authUrl)

const hemera = new Hemera(nats, { logLevel: 'info' })
hemera.use(HemeraJoi)

hemera.ready(() => {

  hemera.add({ 
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required(),
    b: Joi.number().required()
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  hemera.act({ 
    topic: 'math',
    cmd: 'add',
    a: 1,
    b: 2
  }, (err, resp) => {
    hemera.log.info(resp)
  })

})
```

## Documentation
There is an extensive <a href="https://hemerajs.github.io/hemera/">documentation</a> or look in the <a href="https://github.com/hemerajs/hemera/tree/master/examples">Examples</a>. 

## Packages

The `hemera` repo is managed as a monorepo, composed of multiple npm packages.

| General | Version |
|--------|-------|
| [nats-hemera](https://github.com/hemerajs/hemera/tree/master/packages/hemera) | [![npm](https://img.shields.io/npm/v/nats-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/nats-hemera)
| [hemera-zipkin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-zipkin) | [![npm](https://img.shields.io/npm/v/hemera-zipkin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
| [hemera-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) | [![npm](https://img.shields.io/npm/v/hemera-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-store)
| [hemera-stats](https://github.com/hemerajs/hemera/tree/master/packages/hemera-stats) | [![npm](https://img.shields.io/npm/v/hemera-stats.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-stats)
| [hemera-cli](https://github.com/hemerajs/hemera-cli) | [![npm](https://img.shields.io/npm/v/hemera-cli.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-cli)

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

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/hemerajs/hemera/tags). 

## Authors

* **Dustin Deus** - [StarpTech](https://github.com/StarpTech)

See also the list of [contributors](https://github.com/StarpTech/hemera/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Inspiration

[Seneca](https://github.com/senecajs/seneca) - A microservices toolkit for Node.js.

## Support

[![Support via PayPal](https://cdn.rawgit.com/twolfson/paypal-github-button/1.0.0/dist/button.svg)](https://paypal.me/payinstant/5)
