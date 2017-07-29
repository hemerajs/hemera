'use strict'

describe('Default JSON encoder', function () {
  var PORT = 6242
  var authUrl = 'nats://localhost:' + PORT
  var server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Should be able to handle circular references', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {
      hemera.add({
        topic: 'circular',
        cmd: 'test'
      }, (resp, cb) => {
        const fixture = {
          name: 'Tywin Lannister',
          child: {
            name: 'Tyrion Lannister'
          }
        }
        fixture.child.dinklage = fixture.child
        cb(null, fixture)
      })

      hemera.act({
        topic: 'circular',
        cmd: 'test'
      }, function (err, res) {
        expect(err).to.be.not.exists()
        expect(res).to.be.equals({
          name: 'Tywin Lannister',
          child: {
            name: 'Tyrion Lannister',
            dinklage: '[Circular]'
          }
        })
        hemera.close()
        done()
      })
    })
  })
})
