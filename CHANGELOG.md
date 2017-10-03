Changelog
=========

**Further changelogs are tracked in Github release**

# 1.x

### 1.6.3
## Summary
- Implement more robust graceful shutdown
- Activate async / await tests in CI

### 1.6.2
## Summary
- Remove `exit` event in graceful shutdown routine.

### 1.6.1
## Summary
- Refactor graceful shutdown implementation [Commit](https://github.com/hemerajs/hemera/commit/396594d074809b9cf3c17229530550266990208e)
- Fixed some lint issues [Commit](https://github.com/hemerajs/hemera/commit/396594d074809b9cf3c17229530550266990208e)

### 1.6.0
## Summary
Update bloomrun to [4.0.0](https://github.com/mcollina/bloomrun/releases/tag/v4.0.0)

### 1.5.13

## Summary
Update `tinysonic` to 1.3.0 to fix parsing issues in short json syntax e.g `act('a:22de')`, `àct('a: null')`

### 1.5.12

## Summary
The `bloomrun` config `lookupBeforeAdd` is set to `false` by default. This allows to add pattern without to respecting the pattern matching order.
It has no impact on the pattern matching rules.

### 1.5.11

## Summary

- Register hemera and plugin errors in errio to use it in `instanceof` comparison.
- Any error which is created with `hemera.createError` is registered in errio.

### 1.5.9

## Summary

- Throw errors instead emiting

### 1.5.8

## Summary

- Remove typings property from package.json

### 1.5.7

## Summary

- Remove typescript definition files. Thanks to [@vforv](https://github.com/vforv) we provide official [@types/nats-hemera](https://www.npmjs.com/package/@types/nats-hemera)

### 1.5.6

## Summary

- update typescript definition files

### 1.5.5

## Summary

- Throw error when trying to register plugins with `.use()` inside plugins

### 1.5.4

## Summary

- update typescript definition files

### 1.5.3

## Summary

- Check for pattern in `act` and `add` and throw error when pattern is undefined

### 1.5.2

## Summary

- Check if pattern is not undefined in `act`

### 1.5.1

- dump version

## Summary

- Check if pattern is not undefined in `act`

### 1.5.0

## Summary

Functional style in extensions and life-cycle-events. In future we can provide a more consistent and encapsulated interface.

### Updated modules without breaking changes

- hemera-joi
- hemera-avro
- hemera-redis-cache
- hemera-jwt-auth
- hemera-mongo-store
- hemera-rethinkdb-store
- hemera-parambulator
- hemera-slackbot
- hemera-web
- hemera-zipkin
- hemera-nats-streaming

## Breaking change

- Extension and Life-cycle hooks are no longer scoped with the current hemera instance we pass the instance as the first argument

## Migration Checklist

1. Extensions

**Old:**

```js
hemera.ext('onServerPreRequest', function (req, res, next) {
  const ctx = this
  next()
})
hemera.ext('onClose', (done) => {
  const ctx = this
  done()
})
```

**New:**

```js
hemera.ext('onServerPreRequest', function (ctx, req, res, next) {
  next()
})
hemera.ext('onClose', (ctx, done) => {
  done()
})
```

2. Life-cycle events

**Old:**

```js
hemera.ext('clientPostRequest', function () {
  const ctx = this
})

```

**New:**

```js
hemera.ext('onServerPreRequest', function (ctx) {
    next()
})
```

### 1.4.3 - 1.4.4

Lerna issues

### 1.4.2

## Summary
Much better Typescript support

### 1.4.1

## Summary
Implement a new interface to create a pipeline for encoding and decoding the messages. `hemera-msgpack`, `hemera-snappy` and `hemera-avro` was updated.

**New:**

```js
// Replace the default decoder/encoder
hemera.decoder.reset(decode)
hemera.encoder.reset(decode)
// Remove all steps
hemera.decoder.reset()
// Move the pipeline at the first place e.g for compressing algorithms
hemera.decoder.first(uncompress)
// Add a new pipeline step
hemera.decoder.add(function() {
  return { value: <payload>, error: <error> }
})
```

## Summary

### 1.4.0

## Summary

The `close` method is async and accept a callback. Before the close callback is called all registered subscriptions are unsubscribed from NATS as well as all registered pattern. Plugins which have been registered an `onClose` extension can clean up. Every IO will be flushed to NATS before the close callback is called.

- **Upgrade time:** low - none to a couple of hours for most users
- **Complexity:** low - requires following the list of changes to verifying their impact
- **Risk:** none
- **Dependencies:** low - existing plugins will work as-is

## Breaking change

- The `close` method is async and accept a callback

## Migration Checklist

1. If you want to check the error from the `onClose` extension you can do:
**Old:**

```js
hemera.close()
```

**New:**

```js
hemera.close((err) => ...)
```

2. The callback of your tests should be called in the `onClose` handler otherwise the server won't gracefully shutdown before the next test can start.

**Old:**
```js
hemera.close()
```

**New:**

```js
hemera.close(done)
```

### 1.3.24

## Summary

- When removing a topic with `remove(<topic>)` all pattern which belongs to it will be deleted.


### 1.3.23

## Summary

- Fixed some config default values and document options.

### 1.3.22

## Summary

- Validate config with Joi

### 1.3.21

## Summary

- Fixed request duration calculation
- Remove redundant data from protocol (`request.timstamp` and `request.duration` already present in `trace`)
- Make Pino PrettyLogger optional so we can consume the JSON output stream.

### 1.3.20

### Summary

- Humanize duration property in request logging
- Log out- and inbound requests in log level `debug`

### 1.3.19

### Summary
- Cover NATS permission error, gracefully shutdown of hemera on irrevocable connection issues

### 1.3.18

### Summary
- Create plugin class

### 1.3.17

### Summary
- Emit error when plugin was not initialized within the allowed timeout

### 1.3.16

### Summary
- Add pattern to `PATTERN_ALREADY_IN_USE` Error

### 1.3.15

### Summary
- Gracefully shutdown also when hemera is exited by `hemera.fatal`

### 1.3.14

### Summary
- Remove `signal-exit` package and implement a much simpler signal handler to gracefully exit hemera.
- Gracefully shutdown: We will unsubscribe all active subscriptions.
- Gracefully shutdown: We will wait until the client has flush all messages to nats.

### 1.3.13

### Summary
- Attach `trace$.method` to errorDetails.

### 1.3.12

### Summary
- Clean code

### 1.3.11

### Summary
- Allow using custom queue group names via `queue$` property in `add` pattern.

### 1.3.8

### Summary
- We support Async/Await (Node 7.6+), Generators and error-first-callback by default. You don't have to set any options. The `generators` options was removed.

### 1.3.6

### Summary

- **Critical** - Fixed finite loop when we have nested call chain of `act` and the last one does not provide a callback. 

### 1.3.3

### Summary

- Add `tag` property to tagging hemera instances. Used in `hemera-zipkin` to indicate the server instance.

### 1.3.2

### Summary

- Remove passing index and previous value as parameter `hemera.ext(req, resp, next, prevValue, index)`
- Move reply logic from server response to reply.js class
- Update tests
- Add new `onClose` extension point to gracefully shutdown services like hemera-mongo-store and hemera-web
- Declare minimum hemera version in hemera-mongo-store and hemera-web

### 1.3.1

### Summary
- Remove .eslintrc, eslint dependencies from nats-hemera package
- Use [hemera-plugin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin) in all hemera plugins

## 1.3.0

### Summary
- Remove check for dependencies, the developer is responsible for that
- Remove check for duplicate dependencies, the developer is responsible for that
- Remove eslint packages from plugins. We use the root package as linter
- Use `standard` package to lint.
- Create new [hemera-plugin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin) which checks that the bare-minimum version of Hemera is installed and provide a consistent interface to create plugins.
- Add tests for `hemera-plugin`
- Update docs and examples
- Remove `dependencies` property from all hemera packages
- Remove eslint, editorconfig from all hemera packages
- Use `safe-buffer` in [hemera-avro](https://github.com/hemerajs/hemera/tree/master/packages/hemera-avro) package

### Breaking Changes
Hemera is no longer responsible to handle plugin dependencies.

### New Features
- Simplifiy dependency management. Dependencies are installed from the plugin it needs. Since [NPM 3](https://docs.npmjs.com/how-npm-works/npm3) a clean dependency graph is guaranteed.
- Plugin helper [hemera-plugin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin)

### Migration Checklist
- Always use [hemera-plugin](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin) if you want to create a plugin. [Example](https://github.com/hemerajs/hemera/blob/master/examples/basic/plugin.js)
- Check if any plugins has installed the correct dependencies.

### 1.2.16

- Generate unique node id

### 1.2.15

- Unsubscribe subscription by id
- Update streaming example

### 1.2.14

- Emit errors instead throw them because they will be thrown by convention when no error handler exist. This improves async error handling.

### 1.2.13

### Summary

### nats-hemera:
- Don't manipulate original plugin options
### hemera-web
- Introduce blacklist for error propertys
- Add tests

### 1.2.12

### Summary

### nats-hemera:
- Introduce `childLogger` for plugins: It uses internally the child bindings of [Pino](https://github.com/pinojs/pino/blob/master/docs/API.md#childbindings) therefore only possible with default logger Pino.
- Add tests

Example:
```
[2017-05-21T12:11:05.818Z] INFO (hemera-starptech/17328 on starptech):
    plugin: "hemera-web"
    inbound: {
      "id": "33badc7834f541faaf3f4d79a8958715",
      "duration": 0.005121,
      "pattern": "a:1,b:2,cmd:add,topic:math"
    }
```

### 1.2.11

### Summary

### nats-hemera:
- Add `close` event: Is fired before the transport connection is closed.

### hemera-web:
- Fire next when server is listening
- Add tests
- Fixed content type parsing

### 1.2.10

#### Summary
- Configuration: When load policy has been breached we can gracefully exit the process

```
 load: {
  shouldCrash: true, // Should gracefully exit the process to recover from memory leaks or load, crashOnFatal must be enabled
}
```

### 1.2.9

#### Summary
- Improve NATS subject to RegexExp conversion. Support all subject levels `a.*.b`, `a.>`.

### 1.2.8

#### Summary
- Add support for full / token wildcards in topic name [details](https://nats.io/documentation/internals/nats-protocol/)
- Add wildcard [example](https://github.com/hemerajs/hemera/blob/master/examples/wildcards.js)
- Add tests for wildcards

### 1.2.7

#### Summary
- Convert server / client handler to instance members (performance)

### 1.2.6

#### Summary
- Move circuit breaker middleware only on client side [circuit breaker](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- Add tests for callback and promise error handling
- Add test for timeouts
- Circuit breaker is disabled by default and is [configurable](https://github.com/hemerajs/hemera/blob/master/packages/hemera/lib/index.js#L74)

### 1.2.5

#### Summary
- Implement [circuit breaker](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- Add tests for callback and promise error handling

#### 

### 1.2.4

#### Summary
- Fixed util.pattern, don't concatenate objects to `[object Object]`
- Add tests 
- Rename some files to *.spec.js
- Remove referrers meta$ property after recursion error to reduce payload size

### 1.2.3

#### Summary
Manage plugin dependencies. The `dependencies` attribute is used to identify the dependencies of a plugin. When the plugin could not be resolved a warning appears and an error is thrown. Does not provide version dependency which should be implemented using npm peer dependencies.

```js
exports.plugin = function myPlugin (options) {
  var hemera = this

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
}

exports.options = {}

exports.attributes = {
  dependencies: ['hemera-joi'],
  pkg: require('./package.json')
}
```
**Error Message**
```
 Plugin `myPlugin` requires `hemera-foo` as dependency. Please install with 'npm install --save hemera-foo'
```

### 1.2.2

#### Summary
Throw only on NATS connection issues. Complete NATS connection error codes. Ensure that we cover all possible cases.

### 1.2.1

#### Summary
Throw only on NATS connection issues. Authorization and Protocol issues are logged but don't lead to a process termination.

## 1.2.0

### Summary
hemera 1.2.0 is focused on error handling, plugin dependencies

- **Upgrade time:** low - none to a couple of hours for most users
- **Complexity:** low - requires following the list of changes to verifying their impact
- **Risk:** medium - type checks on error will fail because the hemera error was stripped
- **Dependencies:** low - existing plugins will work as-is

### Breaking Changes
You get the exact error you have sent. Errors are wrapped only for framework errors (Parsing errors, Plugin registration errors, Timeout errors) or logging.

### New Features

- Enable Server policy to abort requests when the server is not able to respond cause (max memory, busy event-loop). [Example](https://github.com/hemerajs/hemera/blob/master/test/hemera/load-policy.js) [Configurable](https://github.com/hemerajs/hemera/blob/master/packages/hemera/lib/index.js#L68)
- Long stack traces by default. [Configurable](https://github.com/hemerajs/hemera/blob/master/packages/hemera/lib/index.js#L54)
- Detect message loops (abort the request and return an error). [Example](https://github.com/hemerajs/hemera/blob/master/test/hemera/message-loops.js) [Configurable](https://github.com/hemerajs/hemera/blob/master/packages/hemera/lib/index.js#L50)
- Enrich errors logs with details (pattern, app-name, timestamp).
- Track network hops in error to identify which clients was involved. [Example](https://github.com/hemerajs/hemera/blob/master/examples/error-propagation.js)

### Migration Checklist

1. Pull the wrapped error one level up. For any case except for: HemeraParseError, HemeraError "Error during plugin registration, TimeoutError"

**Old:**
```js
hemera.add({
  topic: 'email',
  cmd: 'send'
}, (resp, cb) => {
  cb(new Error('Uups'))
})

hemera.act({
  topic: 'email',
  cmd: 'send',
  email: 'foobar@gmail.com',
  msg: 'Hi!'
}, (err, resp) => {
  expect(err).to.be.exists()
  expect(err.name).to.be.equals('BusinessError')
  expect(err.message).to.be.equals('Business Error') 
  expect(err.cause.name).to.be.equals('Error')
  expect(err.cause.message).to.be.equals('Uups')
  hemera.close()
  done()
})
```

**New:**

```js
hemera.add({
  topic: 'email',
  cmd: 'send'
}, (resp, cb) => {
  cb(new Error('Uups'))
})

hemera.act({
  topic: 'email',
  cmd: 'send',
  email: 'foobar@gmail.com',
  msg: 'Hi!'
}, (err, resp) => {
  expect(err).to.be.exists()
  expect(err.name).to.be.equals('Error')
  expect(err.message).to.be.equals('Uups')
  hemera.close()
  done()
})
```

2. All logs are wrapped with the correct Hemera error subclass BusinessError, FatalError ...

3. Plugin dependencies are declared with [peerDependencies](https://nodejs.org/en/blog/npm/peer-dependencies/) instead with `dependencies` property in the plugin.

**Old:**
```js
exports.attributes = {
  dependencies: ['hemera-joi']
  pkg: require('./package.json')
}
```
**New:**
```js
"peerDependencies": {
  "hemera-joi": "^1.0.4",
  "nats-hemera": "1.x || 2.x"
}
```
