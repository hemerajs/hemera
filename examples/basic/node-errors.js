'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, { logLevel: 'debug' })

const FooBarError = hemera.createError('FooBarError')

/**
 * IMPORTANT
 * - Always use hemera errors
 * - If you wrap errors only the root issue will reach the requestor
 * - Any additional error data except private _ properties are transfered
 */

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math',
      cmd: 'div'
    },
    function(req, cb) {
      const bar = new FooBarError('bar')
      bar.test = 'test'
      const err = new FooBarError('foo').causedBy(bar)
      cb(err)
    }
  )

  hemera.add(
    {
      topic: 'math',
      cmd: 'sub'
    },
    function(req, cb) {
      const err = new FooBarError().causedBy(new Error('test'))
      cb(err)
    }
  )

  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req, cb) {
      const err = new Error('test')
      cb(err)
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(err, resp) {
      this.log.debug('Instance of: %s', err instanceof Error)
      this.log.debug('Error: %s', err.name)
      this.log.debug('Error message: %s', err.message)
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'sub'
    },
    function(err, resp) {
      this.log.debug('Instance of: %s', err instanceof Error)
      this.log.debug('Error: %s', err.name)
      this.log.debug('Error: %s', err.name)
      this.log.debug('Error message: %s', err.message)
    }
  )

  hemera.act(
    {
      topic: 'math',
      cmd: 'div'
    },
    function(err, resp) {
      this.log.debug('Instance of: %s', err instanceof FooBarError)
      this.log.debug('Error: %s', err.name)
      this.log.debug('Error data: %s', err.test)
      this.log.debug('Error message: %s', err.message)
    }
  )
})
