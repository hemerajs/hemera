---
id: ecosystem
title: Ecosystem
sidebar_label: Ecosystem
---

The `hemera` repo is managed as a monorepo, composed of multiple npm packages. Some packages are managed inside a seperate repository to simplify CI.

| General                                                                                                      | Version                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| [nats-hemera](https://github.com/hemerajs/hemera/tree/master/packages/hemera)                                | [![npm](https://img.shields.io/npm/v/nats-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/nats-hemera)                           |
| [hemera-plugin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin)                       | [![npm](https://img.shields.io/npm/v/hemera-plugin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-plugin)                       |
| [hemera-testsuite](https://github.com/hemerajs/hemera-testsuite)                                             | [![npm](https://img.shields.io/npm/v/hemera-testsuite.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-testsuite)                 |
| [hemera-store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store)                         | [![npm](https://img.shields.io/npm/v/hemera-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-store)                         |
| [hemera-stats](https://github.com/hemerajs/hemera/tree/master/packages/hemera-stats)                         | [![npm](https://img.shields.io/npm/v/hemera-stats.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-stats)                         |
| [hemera-cli](https://github.com/hemerajs/hemera-cli)                                                         | [![npm](https://img.shields.io/npm/v/hemera-cli.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-cli)                             |
| [hemera-mail](https://github.com/hemerajs/hemera/tree/master/packages/hemera-mail)                           | [![npm](https://img.shields.io/npm/v/hemera-mail.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-mail)                           |
| [hemera-slackbot](https://github.com/hemerajs/hemera/tree/master/packages/hemera-slackbot)                   | [![npm](https://img.shields.io/npm/v/hemera-slackbot.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-slackbot)                   |
| [hemera-graceful-shutdown](https://github.com/hemerajs/hemera/tree/master/packages/hemera-graceful-shutdown) | [![npm](https://img.shields.io/npm/v/hemera-graceful-shutdown.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-graceful-shutdown) |
| [hemera-safe-promises](https://github.com/hemerajs/hemera/tree/master/packages/hemera-safe-promises)         | [![npm](https://img.shields.io/npm/v/hemera-safe-promises.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-safe-promises)         |
| [hemera-blipp](https://github.com/hemerajs/hemera/tree/master/packages/hemera-blipp)                         | [![npm](https://img.shields.io/npm/v/hemera-blipp.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-blipp)                         |

| Tracer                                                                                 | Version                                                                                                           |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [hemera-jaeger](https://github.com/hemerajs/hemera/tree/master/packages/hemera-jaeger) | [![npm](https://img.shields.io/npm/v/hemera-jaeger.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jaeger) |

| Metrics                                                                                        | Version                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [hemera-prometheus](https://github.com/hemerajs/hemera/tree/master/packages/hemera-prometheus) | [![npm](https://img.shields.io/npm/v/hemera-prometheus.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-prometheus) |

| Messaging bridges                                                                | Version                                                                                                                           |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [hemera-nats-streaming](https://github.com/hemerajs/hemera-nats-streaming)       | [![npm](https://img.shields.io/npm/v/hemera-nats-streaming.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-nats-streaming) |
| [hemera-rabbitmq](https://github.com/hemerajs/hemera-rabbitmq)                   | [![npm](https://img.shields.io/npm/v/hemera-rabbitmq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rabbitmq)             |
| [hemera-nsq](https://github.com/hemerajs/hemera/tree/master/packages/hemera-nsq) | [![npm](https://img.shields.io/npm/v/hemera-nsq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-nsq)                       |
| [hemera-web](https://github.com/hemerajs/hemera/tree/master/packages/hemera-web) | [![npm](https://img.shields.io/npm/v/hemera-web.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-web)                       |
| [hemera-sqs](https://github.com/hemerajs/hemera/tree/master/packages/hemera-sqs) | [![npm](https://img.shields.io/npm/v/hemera-sqs.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sqs)                       |

| Database adapter                                                             | Version                                                                                                                             |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [hemera-arango-store](https://github.com/hemerajs/hemera-arango-store)       | [![npm](https://img.shields.io/npm/v/hemera-arango-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-arango-store)       |
| [hemera-sql-store](https://github.com/hemerajs/hemera-sql-store)             | [![npm](https://img.shields.io/npm/v/hemera-sql-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-sql-store)             |
| [hemera-elasticsearch](https://github.com/hemerajs/hemera-elasticsearch)     | [![npm](https://img.shields.io/npm/v/hemera-elasticsearch.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-elasticsearch)     |
| [hemera-mongo-store](https://github.com/hemerajs/hemera-mongo-store)         | [![npm](https://img.shields.io/npm/v/hemera-mongo-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-mongo-store)         |
| [hemera-rethinkdb-store](https://github.com/hemerajs/hemera-rethinkdb-store) | [![npm](https://img.shields.io/npm/v/hemera-rethinkdb-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rethinkdb-store) |

| Payload validation                                                                             | Version                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [hemera-joi](https://github.com/hemerajs/hemera/tree/master/packages/hemera-joi)               | [![npm](https://img.shields.io/npm/v/hemera-joi.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-joi) |
| [hemera-ajv (JSON-Schema)](https://github.com/hemerajs/hemera/tree/master/packages/hemera-ajv) | [![npm](https://img.shields.io/npm/v/hemera-ajv.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-ajv) |

| Data serialization                                                                       | Version                                                                                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [hemera-msgpack](https://github.com/hemerajs/hemera/tree/master/packages/hemera-msgpack) | [![npm](https://img.shields.io/npm/v/hemera-msgpack.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-msgpack) |

| Cache                                                                | Version                                                                                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [hemera-redis-cache](https://github.com/hemerajs/hemera-redis-cache) | [![npm](https://img.shields.io/npm/v/hemera-redis-cache.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-redis-cache) |

| Granting / Authenticating                                                                  | Version                                                                                                               |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [hemera-jwt-auth](https://github.com/hemerajs/hemera/tree/master/packages/hemera-jwt-auth) | [![npm](https://img.shields.io/npm/v/hemera-jwt-auth.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jwt-auth) |

## Framwork Integrations

| Name                                                              | Version                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [fastify-hemera](https://github.com/hemerajs/fastify-hemera)      | [![NPM version](https://img.shields.io/npm/v/fastify-hemera.svg?style=flat)](https://www.npmjs.com/package/fastify-hemera) |
| [hapi-hemera](https://github.com/hemerajs/hapi-hemera)            | [![npm](https://img.shields.io/npm/v/hapi-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/hapi-hemera)              |
| [graphql boilerplate](https://github.com/hemerajs/graphql-hemera) | -                                                                                                                          |
