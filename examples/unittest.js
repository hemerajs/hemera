const Hemera = require('./../packages/hemera')
const NatsStub = require('hemera-testsuite/natsStub')
const Assert = require('assert')

const nats = new NatsStub()
const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(function () {
  // Define server method
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  // get server method by pattern signature
  const payload = hemera.router.lookup({
    topic: 'math',
    cmd: 'add'
  })

  // pass arguments
  const request = {
    a: 1,
    b: 2
  }
  // call action  but beware the scope is not set
  payload.action(request, function (err, result) {
    Assert(!err, 'Should not return an error')
    Assert(result === 3, 'Should be 3')
  })
})
