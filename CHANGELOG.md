Changelog
=========

# 1.x

### 1.2.5

#### Summary
- Implement [circuit breaker](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) per server method (add)
- Add tests for callback and promise error handling

Configurable:
```js
circuitBreaker: {
  enabled: false,
  minSuccesses: 1, // Minimum successes in the half-open state to change to close state
  halfOpenTime: 5 * 1000, // The duration when the server is ready to try further calls after changing to open state
  resetIntervalTime: 15 * 1000, // Frequency of reseting the circuit breaker to close state in milliseconds
  maxFailures: 3 // The threshold when the circuit breaker change to open state
}
```

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
