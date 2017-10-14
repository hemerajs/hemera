import Hemera from './../../packages/hemera'
import nats from 'nats'

const hemera = new Hemera(nats.connect(), {
  logLevel: 'debug'
})

hemera.act({
  topic: 'test'
}, function(error, response) {

})
