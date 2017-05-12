'use strict'

describe('Metadata', function () {
  var PORT = 6242
  var flags = ['--user', 'derek', '--pass', 'foobar']
  var authUrl = 'nats://derek:foobar@localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to pass metadata', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats, {
      logLevel: 'silent'
    })

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, function (resp, cb) {
        cb(null, {
          result: resp.a - resp.b
        })
      })

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        expect(this.meta$.a).to.be.equals('test')

        this.act({
          topic: 'math',
          cmd: 'sub',
          a: 1,
          b: 2,
          meta$: {
            b: 33
          }
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(this.meta$.a).to.be.equals('test')
          expect(this.meta$.b).to.be.equals(33)

          cb(null, {
            result: resp.a + resp.b
          })
        })
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        meta$: {
          a: 'test'
        }
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        expect(this.meta$.a).to.be.equals('test')

        this.act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        }, function (err, resp) {
          expect(err).to.be.not.exists()
          expect(this.meta$.a).to.be.equals('test')
          hemera.close()
          done()
        })
      })
    })
  })
})