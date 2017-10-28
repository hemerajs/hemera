# Hemera-web
Http route mapping for Hemera microservices. Based on [Express 4](https://github.com/expressjs/express)

- Depends on minimalist and new web framework Express 4
- Respect `Body` and `Query` payload as pattern
- Provide a REST like interface `/:topic/:cmd` to Hemera
- Transport small binary or text data in pattern
- Returns correct Hemera errors without stack traces

[![npm](https://img.shields.io/npm/v/hemera-web.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-web)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

#### Example

```js
hemera.use(hemeraWeb, {
  port: 3000,
  host: '127.0.0.1',
  pattern: {} // fixed pattern or function (request) => { }
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, parseInt(req.a) + parseInt(req.b))
  })
})
```

### How to execute a server method ?

You can transport the pattern in different ways:

- As Query parameters
- As Payload from type JSON
- As Payload from type x-www-form-urlencoded
- `topic` and `cmd` can be declared in url parameters

### Examples

- GET Request
```
http://localhost:3000?topic=math&cmd=add&a=1&b=2
http://localhost:3000/math/add?a=1&b=2
```
- POST Request
```
http://localhost:3000?topic=math&cmd=add
http://localhost:3000/math/add

Body:
{
  "a": 1,
  "b": 2
}
```
- application/x-www-form-urlencoded
```
http://localhost:3000?topic=math&cmd=add
http://localhost:3000/math/add

Payload: a=1&bd=2
```
### Define default pattern

In Hemera:
```js
const hemera = new Hemera(nats)
hemera.use(hemeraWeb, {
  port: 3000,
  host: '127.0.0.1',
  pattern: {
    topic: 'math'
  }
})

GET - http://localhost:3000?cmd=add&a=1&b=2
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

### Show error stack for debugging

In Hemera:
```js
const hemera = new Hemera(nats)
hemera.use(hemeraWeb, {
  port: 3000,
  host: '127.0.0.1',
  errors: { propBlacklist: [] }
})
```

### Access to express web framework

```js
const hemera = new Hemera(nats)
hemera.use(hemeraWeb, {
  port: 3000,
  host: '127.0.0.1'
})
hemera.ready(() => {
  const app = hemera.express
  // Define Auth layer ... use it as always
  app.use(passport.session())
})
```

