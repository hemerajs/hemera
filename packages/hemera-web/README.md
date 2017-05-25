# Hemera-web
Http route mapping for Hemera microservices. Based on [Micro](https://github.com/zeit/micro)

- Depends on Micro with just ~100 lines of code 
- High Performance, no middleware, just HTTP
- Respect `Body` and `Query` data as pattern
- Transport small binary or text data in the pattern
- Returns correct Hemera errors and without stack traces
- **Requires Node >= 6**

[![npm](https://img.shields.io/npm/v/hemera-web.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-web)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

#### Example

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemeraWeb = require('hemera-web')

const hemera = new Hemera(nats)
hemera.use(hemeraWeb, {
  port: 3000,
  host: '127.0.0.1',
  pattern: {} // default pattern
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })
})
```

### How to execute a server method ?

You can transport the pattern in different ways:

- As Query parameters
- As Payload from type JSON
- As Payload from type x-www-form-urlencoded

### Examples

- GET Request
```
http://localhost:3000?topic=math&cmd=add&a=1&b=2
```
- POST Request
```
http://localhost:3000?topic=math&cmd=add

Body:
{
  "a": 1,
  "b": 2
}
```
- application/x-www-form-urlencoded
```
http://localhost:3000?topic=math&cmd=add

Payload: a=1&bd=2
```
### Error handling

In Hemera:
```js
const CustomError = hemera.createError('CustomError')

hemera.add({
  topic: 'math',
  cmd: 'add'
}, function (req, cb) {
  const error = new CustomError()
  error.statusCode = 404
  cb(error)
})
```
#### Results in
_Status Code_: __404__ - _default (500)_
```json
{
  "error": {
    "name": "Error",
    "message": "test",
    "hops": [
      {
        "service": "math",
        "method": "a:1,b:2,cmd:add,topic:math",
        "app": "hemera-starptech",
        "ts": 299208574491
      }
    ]
  }
}
```
