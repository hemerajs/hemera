'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect({
  preserveBuffers: true
})
const HemeraAvro = require('./../../packages/hemera-avro')
const hemera = new Hemera(nats, {
  logLevel: 'info',
  childLogger: true
})

hemera.use(HemeraAvro)

hemera.ready(() => {
  let Avro = hemera.exposition['hemera-avro'].avro

  const type = Avro.parse({
    name: 'Person',
    type: 'record',
    fields: [
      {
        name: 'a',
        type: 'int'
      }
    ]
  })
  /**
   * Your Implementations
   */
  hemera.add(
    {
      topic: 'peopleDirectory',
      cmd: 'create',
      avro$: type // how to encode the request
    },
    (req, cb) => {
      cb(null, {
        a: 1
      })
    }
  )

  hemera.act(
    {
      topic: 'peopleDirectory',
      cmd: 'create',
      name: 'peter',
      avro$: type // how to decode the response
    },
    function (err, resp) {
      this.log.info(resp, 'Result')
    }
  )
})
