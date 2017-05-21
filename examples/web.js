const Hemera = require('./../packages/hemera')
const HemeraWeb = require('./../packages/hemera-web')
const Axios = require('axios')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraWeb, {
  port: 3000,
  host: 'localhost'
})

hemera.ready(() => {
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, {
      result: req.a + req.b
    })
  })

  hemera.add({
    topic: 'math',
    cmd: 'sub'
  }, (req, cb) => {
    cb(new Error('test'))
  })

  Axios.get('http://127.0.0.1:3000?topic=math&cmd=add&a=1&b=2').then((resp) => {
    hemera.log.info(resp.data)
  })
})
