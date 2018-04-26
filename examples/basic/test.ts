import Hemera from './../../packages/hemera'
import nats from 'nats'

const hemera = new Hemera(nats.connect('nats://127.0.0.1:4242'), {
  logLevel: 'debug'
})

hemera.act({
  topic: 'test'
}, function(error, response) {

})
