# Hemera-joi package

### Example

```js
const Hemera = require('./../')
const Joi = require('joi')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(require('hemera-joi'))

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: Joi.number().required()
  }, (resp, cb) => {

    cb(null, resp.a + resp.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 'dwed3',
    b: 20
  }, function (err, resp) {

    this.log.info('Error', err.cause.message) //Error child "a" fails because ["a" must be a number]
  })
})
```
