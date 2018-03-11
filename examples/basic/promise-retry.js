'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const promiseRetry = require('promise-retry')

const hemera = new Hemera(nats, {
  logLevel: 'silent'
})

hemera.ready(() => {
  const opt = {
    retries: 2, // The maximum amount of times to retry the operation
    factor: 2, // The exponential factor to use
    minTimeout: 1000, // The number of milliseconds before starting the first retry
    maxTimeout: 10000, // The maximum number of milliseconds between two retries
    randomize: false // Randomizes the timeouts by multiplying with a factor between 1 to 2
  }

  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    async function(req) {
      throw new Error('Uuups!')
    }
  )

  promiseRetry(function(retry, number) {
    console.log('Attempt number', number)

    return hemera
      .act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 20
      })
      .catch(retry)
  }, opt)
    .then(resp => console.log(resp.data))
    .catch(err => console.error(err))
})
