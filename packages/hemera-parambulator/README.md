# Hemera-parambulator package

### Example

```js
const Hemera = require('./../')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(require('hemera-parambulator'))

hemera.ready(() => {

  /**
   * Your Implementations
   */
  hemera.add({
    topic: 'math',
    cmd: 'add',
    a: {
      type$: 'number'
    }
  }, (resp, cb) => {

    cb(null, resp.a + resp.b)
  })

  hemera.act({
    topic: 'math',
    cmd: 'add',
    a: 'dwed3',
    b: 20
  }, function (err, resp) {

    this.log.info('Error', err)
  })
})
```
