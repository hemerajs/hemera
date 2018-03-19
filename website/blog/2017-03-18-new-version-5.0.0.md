---
title: New Version 5.0.0-rc.1
author: Dustin Deus
authorURL: https://twitter.com/dustindeus
authorFBID: 100003591443302
---

I'm really happy to announce the new Hemera 5 release!

This release is a ground-breaking refactoring of the core. The goal was to simplify but also make the lifecycle of extensions and middlwares more predictable.

## In summary:

* Refactor extension lifecycle and handling
* Refactor plugin management
* Simplify payload validator and codec interface
* **Brand new [Documentation](https://hemerajs.github.io/hemera/) with https://docusaurus.io/**

### Breaking changes:

* Removed `Reply.end()`
* Removed `hemera.root` property
* Removed `hemera.fatal()`
* Removed `Hemera.reply()` in favor of `hemera.reply.next()` to send multiple responses in a row
* Removed configuration properties `crashOnFatal`, `shouldCrash`. The developer is responsible to catch these errors
* Removed `CodecPipeline`
* Removed `encoder`, `decoder`. We provide setter functions for client and server encoding
* Remove support to register multiple plugins at once with `hemera.use`
* Remove `plugin$`, plugins property, remove `hemera.setOption()`, `hemera.setConfig()` methods
* Remove functionality to to send a response inside `serverPreResponse`. This was confusing because the payload is already set at this point
* Load plugins only on `hemera.ready()` not when `hemera.use()` is called
* We break the support of simple return values in `add` or `middlewares` without the use of callback or promises

### New features:

* Implement schemaCompiler to archive better abstraction for payload validators
* Support for async schemaCompiler
* Encapsulate extensions, codec and schemaCompiler
* Provide setter functions for client and server encoding

### Modified packages

* `hemera-joi` Remove post validation
* Remove support for `hemera-nsq` and `hemera-controlplane`
* `hemera-plugin` you can skip the creation of a plugin scope with `scoped:false`

### Bug fixes

* Fixed issue in add middleware. Passed errors didn't lead to cancellation
