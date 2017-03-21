'use strict'

/**
 * Run mocha ./examples/unittest.js
 */

const Hemera = require('./../packages/hemera')
const Nats = require('hemera-testsuite/natsStub')
const Act = require('hemera-testsuite/actStub')
const Add = require('hemera-testsuite/addStub')
const Code = require('code')
const expect = Code.expect

describe('Math', function () {
  it('Should do some math operations', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, {
      logLevel: 'info'
    })

    // stub act calls
    Act.stub(hemera, { topic: 'math', cmd: 'sub', a: 10, b: 5 }, null, 5)
    Act.stub(hemera, { topic: 'math', cmd: 'add', a: 1, b: 2 }, null, 3)

    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (args, cb) {
        this.act({ topic: 'math', cmd: 'sub', a: 10, b: 5 }, function (err, resp) {
          cb(err, args.a + args.b + resp)
        })
      })
      
      // Important stub when "add" was already added
      // Should execute the server method with the pattern topic:math,cmd:add,a:1,b:2"
      Add.stub(hemera, { topic: 'math', cmd: 'add' }, { a: 1, b: 2 }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(8)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, function(err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(3)
        done()
      })

    })
  })
})
