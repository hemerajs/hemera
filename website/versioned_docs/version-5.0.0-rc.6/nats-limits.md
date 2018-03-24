---
id: version-5.0.0-rc.6-nats-limit
title: NATS limits
sidebar_label: NATS characteristics
original_id: nats-limit
---

## Characteristics

* Max payload size 1MB but it's configurable in NATS Server
* Messages are delivered at-most-once
* SSL Support
* Rely on a publish-subscribe (pub/sub) distribution model
* Cluster support
* Do you need reliable message delivery ? Look at [hemera-nats-streaming](https://github.com/hemerajs/hemera-nats-streaming)

## Quality of Service

At Most Once Delivery (TCP reliability) - In the basic NATS platform, if a subscriber is not listening on the subject (no subject match), or is not active when the message is sent, the message is not received. NATS is a fire-and-forget messaging system. If you need higher levels of service, you can either use NATS Streaming, or build the additional reliability into your client(s) yourself.

For more information see [NATS Frequently Asked Questions](http://nats.io/documentation/faq/)
