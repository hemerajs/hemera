---
id: what-is-hemera
title: What is Hemera?
sidebar_label: What is Hemera?
---

## In a nutshell

- It's a RPC Framework for Node.js
- It's chooses simplicity and reliability over guaranteed delivery
- It's pattern driven by defining your RPC's as JSON objects
- It's very lightweight
- It's extendible via plugins (extensions, middlewares)
- It's horizontal scalable and fault tolerant
- It's very well tested
- It's built with mature packages e.g for the plugin system [Avvio](https://github.com/mcollina/avvio), logging [Pino](https://github.com/pinojs/pino) or Pattern matching [Bloomrun](https://github.com/mcollina/bloomrun)
- It uses [NATS](#what-s-nats) as transport system
- It is 100% compatible with yarn, npm and pnpm
- We support Callback, Promise and Async/Await style
- We offer Docker support
- Hemera means **in Greek mythology the personification of day** so it must be run on daily basis ;)

## What's NATS

[NATS](https://nats.io/) is an open source, lightweight, high-performance cloud native infrastructure messaging system. It implements a highly scalable and elegant publish-subscribe (pub/sub) distribution model. The performant nature of NATS make it an ideal base for building modern, reliable, scalable cloud native distributed systems.

## What is your motivation?

We want to create a toolkit which is responsible for everything expect the transport. We don't need overall transport independence. We trust in a well tested system. The wrong path in error-handling, logging and tracing are one of the reasons why we couldn't use existing solutions.

## Are you the only one who use NATS for microservice architectures?

Definitely not! See [here](http://nats.io/tags/microservices/) to get an impression.
