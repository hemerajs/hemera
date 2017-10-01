'use strict'

/**
 * Create a distributed pipeline
 * 1. Get users
 * 2. Filter users by id
 * The pipeline partners are agree on a property `users` its like the stream in terms of piping.
 */

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(() => {
  hemera.add(
    {
      topic: 'users',
      cmd: 'filterById'
    },
    function*(req) {
      return {
        users: req.users.filter(u => u.userId === req.userId)
      }
    }
  )
  hemera.add(
    {
      topic: 'users',
      cmd: 'getAll'
    },
    function*(req) {
      return {
        users: [
          {
            userId: 1,
            name: 'peter'
          },
          {
            userId: 2,
            name: 'klaus'
          }
        ]
      }
    }
  )

  new Pipeline(hemera)
    .pipe({
      topic: 'users',
      cmd: 'getAll'
    })
    .pipe({
      topic: 'users',
      cmd: 'filterById',
      userId: 1
    })
    .exec()
    .then(res => {
      hemera.log.info(res)
    })
    .catch(err => {
      hemera.log.error(err)
    })
})

/**
 * Helper class
 *
 * @class Pipeline
 */
class Pipeline {
  /**
   * Creates an instance of Pipeline.
   * @param {any} hemera
   *
   * @memberof Pipeline
   */
  constructor(hemera) {
    this._hemera = hemera
    this._stack = []
  }

  /**
   *
   *
   * @param {any} pattern
   * @returns
   *
   * @memberof Pipeline
   */
  pipe(pattern) {
    this._stack.push(prev => {
      return this._hemera.act(Object.assign(pattern, prev))
    })
    return this
  }

  /**
   *
   *
   * @returns
   *
   * @memberof Pipeline
   */
  exec() {
    return this._stack.reduce((promise, item) => {
      return promise
        .then(result => {
          return item(result)
        })
        .catch(console.error)
    }, Promise.resolve())
  }
}
