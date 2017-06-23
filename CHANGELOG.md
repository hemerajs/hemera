Changelog
=========

# 1.x

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
