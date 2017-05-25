<p align="center">
<img src="https://github.com/StarpTech/hemera/raw/master/media/hemera-logo.png" alt="Hemera" style="max-width:100%;">
</p>

<p align="center">
<a href="http://opensource.org/licenses/MIT"><img src="https://camo.githubusercontent.com/11ad3ffb000cd7668567587af947347c738b6472/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f657870726573732e7376673f7374796c653d666c61742d737175617265266d61784167653d33363030" alt="License MIT" data-canonical-src="https://img.shields.io/npm/l/express.svg?amp;maxAge=3600" style="max-width:100%;"></a>
<a href="https://travis-ci.org/hemerajs/hemera"><img src="https://camo.githubusercontent.com/b727088ce24fb5b56d5b1f746dc6648868b835f3/68747470733a2f2f7472617669732d63692e6f72672f68656d6572616a732f68656d6572612e7376673f6272616e63683d6d6173746572267374796c653d666c61742d737175617265" alt="Build Status" data-canonical-src="https://travis-ci.org/hemerajs/hemera.svg?branch=master" style="max-width:100%;"></a>
<a href="https://ci.appveyor.com/project/StarpTech/hemera"><img src="https://ci.appveyor.com/api/projects/status/s3to4boq8yawulpn?svg=true" alt="Build Status" data-canonical-src="https://ci.appveyor.com/project/StarpTech/hemera" style="max-width:100%;"></a>
<a href="https://coveralls.io/github/hemerajs/hemera?branch=master"><img src="https://camo.githubusercontent.com/2b9676a6b88d202578519f30faac24db7a4c7661/68747470733a2f2f636f766572616c6c732e696f2f7265706f732f6769746875622f68656d6572616a732f68656d6572612f62616467652e7376673f6272616e63683d6d61737465722674733d39393939267374796c653d666c61742d737175617265" alt="Coverage Status" data-canonical-src="https://coveralls.io/repos/github/hemerajs/hemera/badge.svg?branch=master&amp;ts=9999" style="max-width:100%;"></a>
<a href="https://gitter.im/hemerajs/hemera"><img src="https://camo.githubusercontent.com/e7536e01bc9c129b974e11c26b174f54e50c6d69/68747470733a2f2f696d672e736869656c64732e696f2f6769747465722f726f6f6d2f6e776a732f6e772e6a732e7376673f7374796c653d666c61742d737175617265266d61784167653d33363030" alt="Gitter" data-canonical-src="https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=3600" style="max-width:100%;"></a>
<img src="https://camo.githubusercontent.com/58fbab8bb63d069c1e4fb3fa37c2899c38ffcd18/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f636f64655f7374796c652d7374616e646172642d627269676874677265656e2e737667" alt="JavaScript Style Guide" data-canonical-src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" style="max-width:100%;">
<a href="https://snyk.io/test/github/hemerajs/hemera"><img src="https://snyk.io/test/github/hemerajs/hemera/badge.svg?targetFile=packages%2Fhemera%2Fpackage.json" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/hemerajs/hemera?targetFile=packages%2Fhemera%2Fpackage.json" style="max-width:100%;"></a>
</p>

<p align="center">
A <a href="http://nodejs.org/">Node.js</a> microservices toolkit for the <a href="https://nats.io">NATS messaging system</a>
</p>

- __Node:__ 4.x, 5.x, 6.x, 7.x
- __Documentation:__ https://hemerajs.github.io/hemera/
- __Website:__ https://hemerajs.github.io/hemera-site/
- __Lead Maintainer:__ [Dustin Deus](https://github.com/StarpTech)

## 📓 Getting Started

Hemera (/ˈhɛmərə/; Ancient Greek: Ἡμέρα [hɛːméra] "day") is a small wrapper around the NATS driver. NATS is a simple, fast and reliable solution for the internal communication of a distributed system. It chooses simplicity and reliability over guaranteed delivery. We want to provide a toolkit to develop micro services in an easy and powerful way. We use bloom filters to provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful.

With Hemera you have the best of both worlds. Efficient pattern matching to have the most flexibility in defining your RPC's. It doesn't matter where your server or client lives. You can add the same `add` as many as you want on different hosts to ensure maximal availability. The only dependency you have is a single binary of 7MB. Mind your own business NATS do the rest for you:

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
* **Request & Reply**: By default point-to-point involves the fastest or first to respond.
* **Pubish & Subscribe**: Hemera supports all features of NATS. This includes wildcards in subjects and normal publish and fanout mechanism.
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
const nats = require('nats').connect()

const hemera = new Hemera(nats, { logLevel: 'info', generators: true })
hemera.use(HemeraJoi)

hemera.ready(() => {

  let Joi = hemera.exposition['hemera-joi'].joi

  hemera.add({ 
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required(),
    b: Joi.number().required()
  }, function* (req) {
    return yield Promise.resolve(req.a + req.b)
  })

  const a = hemera.act({ topic: 'math', cmd: 'add', a: 10, b: 30 })
  const b = hemera.act({ topic: 'math', cmd: 'add', a: 10, b: 60 })

  Promise.all([a, b])
    .then(x => hemera.log.info(x))

})
```

## Documentation
There is an extensive <a href="https://hemerajs.github.io/hemera/">documentation</a> or look in the <a href="https://github.com/hemerajs/hemera/tree/master/examples">Examples</a>.

## Get Involved

- **Contributing**: Pull requests are welcome!
    - Read [`CONTRIBUTING.md`](https://github.com/hemerajs/hemera/blob/master/CONTRIBUTING.md) and check out our [help-wanted](https://github.com/hemerajs/hemera/issues?q=is%3Aissue+is%3Aopen+label%3Astatus%3Ahelp-wanted) issues
    - Submit github issues for any feature enhancements, bugs or documentation problems
- **Support**: Join our [gitter chat](https://gitter.im/hemerajs/hemera) to ask questions to get support from the maintainers and other Hemera developers
    - Questions/comments can also be posted as [github issues](https://github.com/hemerajs/hemera/issues)
- **Discuss**: Tweet using the `#HemeraJs` hashtag

## Be aware of your requirements

Hemera has not been designed for high performance on a single process. It has been designed to create lots of microservices doesn't matter where they live. It choose simplicity and reliability as primary goals. It act together with NATS as central nervous system of your distributed system. Transport independency was not considered to be a relevant factor. In addition we use pattern matching which is very powerful. The fact that Hemera needs a broker is an argument which should be taken into consideration when you compare hemera with other frameworks. The relevant difference between microservice frameworks like senecajs, molecurer is not the performance or modularity its about the complexity you need to manage. Hemera is expert in providing an interface to work with lots of services in the network, NATS is the expert to deliver the message at the right place. Hemera is still a subscriber of NATS with some magic in routing and extensions. We don't have to worry about all different aspects in a distributed system like routing, load-balancing, service-discovery, clustering, health-checks ... 

## Packages

The `hemera` repo is managed as a monorepo, composed of multiple npm packages.

| General | Version |
|--------|-------|
| [nats-hemera](https://github.com/hemerajs/hemera/tree/master/packages/hemera) | [![npm](https://img.shields.io/npm/v/nats-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/nats-hemera)
| [hemera-zipkin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-zipkin) | [![npm](https://img.shields.io/npm/v/hemera-zipkin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-zipkin)
| [hemera-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) | [![npm](https://img.shields.io/npm/v/hemera-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-store)
| [hemera-stats](https://github.com/hemerajs/hemera/tree/master/packages/hemera-stats) | [![npm](https://img.shields.io/npm/v/hemera-stats.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-stats)
| [hemera-controlplane](https://github.com/hemerajs/hemera/tree/master/packages/hemera-controlplane) | [![npm](https://img.shields.io/npm/v/hemera-controlplane.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-controlplane)
| [hemera-cli](https://github.com/hemerajs/hemera-cli) | [![npm](https://img.shields.io/npm/v/hemera-cli.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-cli)
| [hemera-mail](https://github.com/hemerajs/hemera-mail) | [![npm](https://img.shields.io/npm/v/hemera-mail.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-mail)

| Messaging bridges | Version |
|--------|-------|
| [hemera-rabbitmq](https://github.com/hemerajs/hemera/tree/master/packages/hemera-rabbitmq) | [![npm](https://img.shields.io/npm/v/hemera-rabbitmq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rabbitmq)
| [hemera-nsq](https://github.com/hemerajs/hemera/tree/master/packages/hemera-nsq) | [![npm](https://img.shields.io/npm/v/hemera-nsq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-nsq)
| [hemera-web](https://github.com/hemerajs/hemera/tree/master/packages/hemera-web) | [![npm](https://img.shields.io/npm/v/hemera-web.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-web)

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

| Data compression | Version |
|--------|-------|
| [hemera-snappy](https://github.com/hemerajs/hemera/tree/master/packages/hemera-snappy) | [![npm](https://img.shields.io/npm/v/hemera-snappy.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-snappy)

| Cache | Version |
|--------|-------|
| [hemera-redis-cache](https://github.com/hemerajs/hemera/tree/master/packages/hemera-redis-cache) | [![npm](https://img.shields.io/npm/v/hemera-redis-cache.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-redis-cache)

| Granting / Authenticating | Version |
|--------|-------|
| [hemera-jwt-auth](https://github.com/hemerajs/hemera/tree/master/packages/hemera-jwt-auth) | [![npm](https://img.shields.io/npm/v/hemera-jwt-auth.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jwt-auth)

## Changelog

See [CHANGELOG.md](CHANGELOG.md)

## Contributing

Please read [CONTRIBUTING.md](https://github.com/hemerajs/hemera/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. Available versions [tags on this repository](https://github.com/hemerajs/hemera/tags). 

## Authors

* **Dustin Deus** - [StarpTech](https://github.com/StarpTech)

See also the list of [contributors](https://github.com/StarpTech/hemera/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Inspiration

[Seneca](https://github.com/senecajs/seneca) - A microservices toolkit for Node.js.

## Professional services
Hemera is free for any use (MIT license). If you are in production don't miss the professional support service. For courses and training send me an email to [deusdustin@gmail.com](deusdustin@gmail.com) or contact me private on <a href="https://gitter.im/hemerajs/hemera"><img src="https://camo.githubusercontent.com/e7536e01bc9c129b974e11c26b174f54e50c6d69/68747470733a2f2f696d672e736869656c64732e696f2f6769747465722f726f6f6d2f6e776a732f6e772e6a732e7376673f7374796c653d666c61742d737175617265266d61784167653d33363030" alt="Gitter" data-canonical-src="https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=3600" style="max-width:100%;"></a>

## Support / Donate
We prefer a PR but if you have no time but want to give us something back you can support us with a starbucks coffee [PaypalMe](https://paypal.me/payinstant/5)
