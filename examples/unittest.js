/**
 * Run mocha ./examples/unittest.js
 */

const Hemera = require('./../packages/hemera')
const NatsStub = require('hemera-testsuite/natsStub')
const Code = require('code')
const expect = Code.expect

describe('Math', function () {
  it('Should add two numbers', function (done) {
    const nats = new NatsStub()
    const hemera = new Hemera(nats, {
      logLevel: 'info'
    })

    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        cb(null, resp.a + resp.b)
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
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(3)
        done()
      })
    })
  })
})
