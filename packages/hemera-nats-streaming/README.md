# Hemera-nats-streaming package

[![npm](https://img.shields.io/npm/v/hemera-nats-streaming.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-nats-streaming)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

This is a plugin to use [NATS-Streaming](http://nats.io/) with Hemera.
We use the official [Node-nats-streaming](https://github.com/nats-io/node-nats-streaming) client.
Since nats-streaming based on NATS Server you are able to run both technologies with one NATS-streaming-server.

- [Download](http://nats.io/download/nats-io/nats-streaming-server/) and start nats-streaming-server
- Start hemera and use this plugin to initialize a connection to the streaming server
- You can now use hemera and nats-streaming with one server!

We provide a simple interface to work with nats-streaming

- **topic:nats-streaming,cmd:publish:** Publish a message to nats-streaming.
- **topic:nats-streaming,cmd:subscribe:** Create a nats-streaming subscription and return a ack when the subscription could be created. Any received message will be forwared to your handler.
- **topic:nats-streaming,cmd:unsubscribe:** Unsubscribe an active nats-streaming subscription.
- **topic:nats-streaming,cmd:suspend:** Suspend an durable nats-streaming subscription. You can active it if you call `subscribe` again.

### Why you don't implement nats-streaming in hemera?
They use the same server but the purpose is quite different with hemera we want to provide a simple toolkit without any delivery guarantee. NATS-streaming was created to fill this gap with a mimimalistic protocol extension. We can use this feature while creating a simple bridge to nats-streaming. It will create a minimal roundtrip overhead but it's tolerable. The greatest fact is that we can run both technologies side by side* with one nats-streaming-server.

_*nats-streaming-server_ hasn't support for cluster mode but it's planned for this year 2017.

### Limitations
- Since we use it as a bridge we cannot manually acknowledge a message.
- Only JSON support

### Documentation
Look in the source code all options are well documented.

### Example
[Example](/examples/bridges/nats-streaming.js)
