<p align="center">
<img src="https://hemerajs.github.io/hemera/img/hemera.png" alt="Hemera" style="max-width:100%;">
</p>

<p align="center">
<a href="http://opensource.org/licenses/MIT"><img src="https://camo.githubusercontent.com/11ad3ffb000cd7668567587af947347c738b6472/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f657870726573732e7376673f7374796c653d666c61742d737175617265266d61784167653d33363030" alt="License MIT" data-canonical-src="https://img.shields.io/npm/l/express.svg?amp;maxAge=3600" style="max-width:100%;"></a>
<a href="https://travis-ci.org/hemerajs/hemera"><img src="https://travis-ci.org/hemerajs/hemera.svg?branch=master" alt="Build Status" data-canonical-src="https://travis-ci.org/hemerajs/hemera.svg?branch=master" style="max-width:100%;"></a>
<a href="https://ci.appveyor.com/project/StarpTech/hemera"><img src="https://ci.appveyor.com/api/projects/status/s3to4boq8yawulpn?svg=true" alt="Build Status" data-canonical-src="https://ci.appveyor.com/project/StarpTech/hemera" style="max-width:100%;"></a>
<a href='https://coveralls.io/github/hemerajs/hemera?branch=master'><img src='https://coveralls.io/repos/github/hemerajs/hemera/badge.svg?branch=master' alt='Coverage Status' /></a>
<a href="https://gitter.im/hemerajs/hemera"><img src="https://camo.githubusercontent.com/e7536e01bc9c129b974e11c26b174f54e50c6d69/68747470733a2f2f696d672e736869656c64732e696f2f6769747465722f726f6f6d2f6e776a732f6e772e6a732e7376673f7374796c653d666c61742d737175617265266d61784167653d33363030" alt="Gitter" data-canonical-src="https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=3600" style="max-width:100%;"></a>
<img src="https://camo.githubusercontent.com/58fbab8bb63d069c1e4fb3fa37c2899c38ffcd18/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f636f64655f7374796c652d7374616e646172642d627269676874677265656e2e737667" alt="JavaScript Style Guide" data-canonical-src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" style="max-width:100%;">
<a href="https://snyk.io/test/github/hemerajs/hemera?targetFile=packages%2Fhemera%2Fpackage.json"><img src="https://snyk.io/test/github/hemerajs/hemera/badge.svg?targetFile=packages%2Fhemera%2Fpackage.json" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/hemerajs/hemera?targetFile=packages%2Fhemera%2Fpackage.json" style="max-width:100%;"></a>
<a href="https://lernajs.io/"><img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="lerna" data-canonical-src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" style="max-width:100%;"></a>
</p>

<p align="center">
A <a href="http://nodejs.org/">Node.js</a> microservices toolkit for the <a href="https://nats.io">NATS messaging system</a>
<br>Run on <a href="https://repl.it/@StarpTech/Hemera-5">repl.it</a>
</p>

* **Node:** v6+
* **Documentation:** https://hemerajs.github.io/hemera/
* **Lead Maintainer:** [Dustin Deus](https://github.com/StarpTech)

## 📓 Getting Started

Hemera (/ˈhɛmərə/; Ancient Greek: Ἡμέρα [hɛːméra] "day") is a small wrapper around the official NATS driver. NATS is a simple, fast and reliable solution for the internal communication of a distributed system. It chooses simplicity and reliability over guaranteed delivery. We want to provide a toolkit to develop micro services in an easy and powerful way. We provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful.

With Hemera you have the best of both worlds. Efficient pattern matching to have the most flexibility in defining your RPC's. It doesn't matter where your server or client lives. You can start as many services you want on different hosts to ensure maximal availability. The only dependency you have is a single binary of \~10MB. Mind your own business NATS will do the rest for you:

The key features of NATS in combination with Hemera are:

* **Lightweight**: The Hemera core is small as possible and provide an extensive [plugin system](https://hemerajs.github.io/hemera/docs/plugin.html).
* **Location transparency**: A service may be instantiated in different locations at different times. An application interacting with an service and does not know the service physical location.
* **Service Discovery**: You don't need a service discovery all subscriptions are managed by NATS.
* **Load Balancing**: Requests are load balanced (random) by NATS mechanism of "queue groups".
* **Packages**: We provide reliable and modern plugins to the community.
* **High performant**: NATS is able to handle million of requests per second.
* **Scalability**: Filtering on the subject name enables services to divide work (perhaps with locality).
* **Fault tolerance**: Auto-heals when new services are added. Configure cluster mode to be more reliable.
* **Auto-pruning**: NATS automatically handles a slow consumer and cut it off.
* **Pattern driven**: Define RPC's in JSON and use the flexibility of pattern-matching.
* **Request & Reply**: By default point-to-point involves the fastest or first to respond.
* **Publish & Subscribe**: Hemera supports all features of NATS. This includes wildcards in subjects and normal publish and fanout mechanism.
* **Tracing**: Builtin tracing capabilities but we also provide plugin for [Jaeger](https://github.com/jaegertracing/jaeger).
* **Monitoring**: NATS server can be monitored by cli or a dashboard.
* **Payload validation**: Create your own validator or use existing plugins e.g [hemera-joi](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi) or [hemera-ajv](https://github.com/hemerajs/hemera/tree/master/packages/hemera-ajv).
* **Serialization**: Use custom serializer e.g [hemera-mgspack](https://github.com/hemerajs/hemera/tree/master/packages/hemera-msgpack).
* **Metadata**: Transfer metadata across services or attach contextual data to tracing systems.
* **Dependencies**: NATS is a single binary of \~10MB and can be deployed in seconds.
* **Typescript**: We provide typings.

## Built in protection

* **Process policy**: Will exit the process when the policy (memory, event loop) could not be fullfilled (Option: `heavy`).
* **Message loop detection**: Will return an error if you call a route recursively (Option: `maxRecursion`).
* **Safe default JSON serializer**: Provides a deterministic version and will also gracefully handle circular structures.

## Who's using Hemera?

| [![appcom-interactive](https://hemerajs.github.io/hemera/img/company/appcom.svg)](http://www.appcom-interactive.de/) | [![amerbank](https://hemerajs.github.io/hemera/img/company/amerbank.png)](https://amerbank.com/) | [![savicontrols](https://hemerajs.github.io/hemera/img/company/savicontrols.png)](https://www.savicontrols.com/) | [![mercado unico](https://hemerajs.github.io/hemera/img/company/mercado-unico.png)](https://www.mercado-unico.com/) |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| appcom interactive                                                                                                   | amerbank                                                                                         | savicontrols                                                                                                     | mercado unico                                                                                                       |

## Get Involved

* **Contributing**: Pull requests are welcome!
  * Read [`CONTRIBUTING.md`](https://github.com/hemerajs/hemera/blob/master/CONTRIBUTING.md) and check out our [help-wanted](https://github.com/hemerajs/hemera/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) issues
  * Submit github issues for any feature enhancements, bugs or documentation problems
* **Support**: Join our [gitter chat](https://gitter.im/hemerajs/hemera) to ask questions to get support from the maintainers and other Hemera developers
  * Questions/comments can also be posted as [github issues](https://github.com/hemerajs/hemera/issues)
* **Discuss**: Tweet using the `#HemeraJs` hashtag

## Contributing

Please read [CONTRIBUTING.md](https://github.com/hemerajs/hemera/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Supported Node Versions    

Support policy for Nodejs versions follows 
[Nodejs release support]( https://github.com/nodejs/Release).
We will support and build hemera on even Nodejs versions that are current 
or in maintenance.

# Professional services

Hemera is free for any use (MIT license). If you are in production don't miss the professional support service. For courses and training send me an email to [deusdustin@gmail.com](deusdustin@gmail.com) or contact me private on <a href="https://gitter.im/hemerajs/hemera"><img src="https://camo.githubusercontent.com/e7536e01bc9c129b974e11c26b174f54e50c6d69/68747470733a2f2f696d672e736869656c64732e696f2f6769747465722f726f6f6d2f6e776a732f6e772e6a732e7376673f7374796c653d666c61742d737175617265266d61784167653d33363030" alt="Gitter" data-canonical-src="https://img.shields.io/gitter/room/nwjs/nw.js.svg?maxAge=3600" style="max-width:100%;"></a>

# Sponsorship

Development of the hemera core module generously supported by contributions from individuals and corporations. If you are benefiting from hemera and would like to help keep the project financially sustainable, please visit [Dustin Deus](https://www.patreon.com/starptech) Patreon page, his [Paypal Me](https://www.paypal.me/payinstant/25) or contact him via [email](mailto:deusdustin@gmail.com).
