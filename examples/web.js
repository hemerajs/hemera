const Hemera = require('./../packages/hemera')
const HemeraWeb = require('./../packages/hemera-web')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraWeb)

hemera.ready(() => {

  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, (req, cb) => {
    cb(new Error('test'))
  })

})