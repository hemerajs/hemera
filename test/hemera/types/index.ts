import * as Hemera from './../../../packages/hemera'
import * as nats from 'nats'

const hemera = new Hemera(nats.connect('nats://127.0.0.1:4242'), {
  logLevel: 'debug'
})

hemera.ready(async (err: Error) => {
  // callback-style
  hemera.ext('onAct', function(hemera, next) {
    // some code
    next()
  })
  hemera.ext('onActFinished', function(hemera, next) {
    // some code
    next()
  })

  hemera.ext('preHandler', function(hemera, request, reply, next) {
    // some code
    next()
  })
  hemera.ext('onRequest', function(hemera, request, reply, next) {
    // some code
    next()
  })
  hemera.ext('onSend', function(hemera, request, reply, next) {
    // some code
    next()
  })
  hemera.ext('onResponse', function(hemera, reply, next) {
    // some code
    next()
  })

  // async/await
  hemera.ext('preHandler', async function(hemera, request, reply) {
    // some code
  })
  hemera.ext('onAct', async hemera => {
    // some code
  })
  hemera.ext('onResponse', async function(hemera, reply) {
    // some code
  })
  hemera.ext('onClose', async addDefinition => {
    // some code
  })
  hemera.ext('onAdd', async addDefinition => {
    // some code
  })

  hemera.add(
    {
      topic: 'test'
    },
    function(request: Hemera.ServerPattern, cb: Hemera.NodeCallback) {
      cb(null, true)
    }
  )

  hemera.add(
    {
      topic: 'testAsync'
    },
    async function(request: Hemera.ServerPattern) {
      return true
    }
  )

  hemera.act(
    {
      topic: 'test'
    },
    function(error: Error, response: any) {
      this.log.info(error, response)
      this.log.info(this.trace$)
    }
  )

  const response = await hemera.act({
    topic: 'test'
  })

  response.context.log.info(response.data)
})
