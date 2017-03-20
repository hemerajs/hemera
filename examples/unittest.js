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
  it('Should add two numbers', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, {
      logLevel: 'info'
    })

    // Should return the payload "hello" when someone call the pattern "topic:test"
    Act.stub(hemera, { topic: 'test' }, null, 'hello')
    // Should execute the server method with the pattern topic:math,cmd:add,a:1,b:2"
    Add.stub(hemera, { topic: 'math', cmd: 'add' }, { a: 1, b: 2 }, function (err, result) {
      expect(err).to.be.not.exists()
      expect(result).to.be.equals('3hello')
      done()
    })

    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (args, cb) {
        this.act({ topic: 'test' }, function (err, resp) {
          this.log.info('hello')
          cb(err, args.a + args.b + resp)
        })
      })
    })
  })
})
