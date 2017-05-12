describe('Streaming', function () {
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

  it('Should be able to receive lots of messages from the INBOX channel', function (done) {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    const results = []

    hemera.ready(() => {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, reply) => {
        for (let i = 0; i < 100; i++) {
          reply(null, i)
        }
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        maxMessages$: -1
      }, function (err, resp) {
        expect(err).to.be.not.exists()
        results.push(resp)
        if (results.length === 100) {
          hemera.close()
          done()
        }
      })
    })
  })
})