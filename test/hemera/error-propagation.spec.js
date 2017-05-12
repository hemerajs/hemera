describe('Error propagation', function () {
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

  it('Error propagation', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          expect(err).to.be.exists()
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        cb(new Error('B Error'))
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        // In a chain of nested wrapped errors, the original unwrapped cause can be accessed through the rootCause property of each SuperError instance in the chain.
        expect(err.rootCause.name).to.be.equals('Error')
        expect(err.rootCause.message).to.be.equals('B Error')

        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')
        expect(err.pattern.topic).to.be.exists('b')
        expect(err.app).to.be.exists()

        expect(err.cause.name).to.be.equals('Error')
        expect(err.cause.message).to.be.equals('B Error')

        hemera.close()
        done()
      })
    })
  })

  it('Error propagation with super errors', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'a',
        cmd: 'a'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          expect(err).to.be.exists()
          this.act({
            topic: 'c',
            cmd: 'c'
          }, function (err, resp) {
            cb(err, resp)
          })
        })
      })
      hemera.add({
        topic: 'b',
        cmd: 'b'
      }, (resp, cb) => {
        const a = new UnauthorizedError('test')
        a.test = 444
        cb(a)
      })
      hemera.add({
        topic: 'c',
        cmd: 'c'
      }, function (resp, cb) {
        this.act({
          topic: 'b',
          cmd: 'b'
        }, function (err, resp) {
          cb(err, resp)
        })
      })

      hemera.act({
        topic: 'a',
        cmd: 'a'
      }, (err, resp) => {
        expect(err).to.be.exists()

        // In a chain of nested wrapped errors, the original unwrapped cause can be accessed through the rootCause property of each SuperError instance in the chain.
        expect(err.rootCause.name).to.be.equals('Unauthorized')
        expect(err.rootCause.message).to.be.equals('test')

        expect(err.name).to.be.equals('BusinessError')
        expect(err.message).to.be.equals('Business error')

        expect(err.cause.name).to.be.equals('Unauthorized')
        expect(err.cause.message).to.be.equals('test')
        expect(err.cause.test).to.be.equals(444)

        hemera.close()
        done()
      })
    })
  })
})