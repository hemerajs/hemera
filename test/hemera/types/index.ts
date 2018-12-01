import * as Hemera from './../../../packages/hemera'
import * as nats from 'nats'

const hemera = new Hemera(nats.connect('nats://127.0.0.1:4242'), {
  logLevel: 'debug'
})

hemera.ready((err: Error) => {
  hemera.ext('onAdd', function(addDefintion: Hemera.AddDefinition) {})
  hemera.ext('onClose', function(
    hemera: Hemera<Hemera.NoContext, Hemera.NoContext>
  ) {})
  hemera.ext('onSend', function(hemera, request, reply, next) {
    next()
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

  const response = hemera.act({
    topic: 'test'
  })

  response.then(responseData => {
    responseData.context.log.info(responseData.data)
  })
})
