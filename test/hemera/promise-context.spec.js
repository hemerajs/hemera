describe('Promise context', function() {
  const PORT = 6242
  const authUrl = 'nats://localhost:' + PORT
  let server

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  after(function() {
    server.kill()
  })

  it('Should be able to act with context', function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    return hemera.ready().then(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        resp => {
          return Promise.resolve(resp.a + resp.b)
        }
      )

      return hemera
        .act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        })
        .then(out => {
          expect(out.data).to.be.equals(3)
          return out.context.act({
            topic: 'math',
            cmd: 'add',
            a: 1,
            b: 2
          })
        })
        .then(() => hemera.close())
    })
  })

  it('Should pass the correct context', function() {
    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    return hemera.ready().then(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        resp => {
          return Promise.resolve(resp.a + resp.b)
        }
      )

      return hemera
        .act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2,
          context$: { a: 1 },
          meta$: { a: 2 },
          delegate$: { a: 3 }
        })
        .then(out => {
          expect(out.data).to.be.equals(3)
          expect(out.context.delegate$).to.be.equals({ a: 3 })
          return out.context
            .act({
              topic: 'math',
              cmd: 'add',
              a: 1,
              b: 2
            })
            .then(out => {
              expect(out.context.context$).to.be.equals({ a: 1 })
              expect(out.context.meta$).to.be.equals({ a: 2 })
            })
        })
        .then(() => hemera.close())
    })
  })
})
