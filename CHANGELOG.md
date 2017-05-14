Changelog
=========

# 1.x

### 1.2.2

#### Summary
Throw only on NATS connection. Complete NATS connection error codes. Ensure that we covers all possible cases.

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
