import * as Hemera from './../../packages/hemera'
import * as nats from 'nats'

const hemera = new Hemera(nats.connect('nats://127.0.0.1:4242'), {
  logLevel: 'debug'
})

hemera.on('serverPreResponse', function(hemera) {
})
hemera.ext('onServerPreResponse', function(hemera, request, reply, next) {
  next()
})

hemera.add({
  topic: 'test'
}, function(request: Hemera.ServerPattern, cb: Hemera.NodeCallback) {
  cb(null, true)
})

hemera.act({
  topic: 'test'
}, function(error: Error, response: any) {
  this.log.info(error, response)
})
