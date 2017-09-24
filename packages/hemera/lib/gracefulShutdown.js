'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Module Dependencies
 */

const _ = require('lodash')
const Errors = require('./errors')
const Constants = require('./constants')
const parallel = require('fastparallel')()

/**
 *
 *
 * @class GracefulShutdown
 */
class GracefulShutdown {
  /**
   * Creates an instance of GracefulShutdown.
   * @memberof GracefulShutdown
   */
  constructor (logger) {
    this.logger = logger
    this.handlers = []
    this.clean = false
    this.signals = ['SIGINT', 'SIGTERM']
  }

  /**
   *
   *
   * @param {any} fn
   * @memberof GracefulShutdown
   */
  addHandler (fn) {
    if (!_.isFunction(fn)) {
      throw new Errors.HemeraError('Expected a function but got a ' + typeof fn)
    }

    this.handlers.push(fn)
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} code
   * @memberof GracefulShutdown
   */
  completed (err, code) {
    if (err) {
      this.logger.error({ err: err, exitCode: code }, Constants.GRACEFULLY_SHUTDOWN)
      process.exit(1)
    } else {
      this.logger.info({ exitCode: code }, Constants.GRACEFULLY_SHUTDOWN)
      process.exit(0)
    }
  }

  /**
   *
   *
   * @param {any} code
   * @memberof GracefulShutdown
   */
  shutdown (code) {
    if(!this.clean) {
      this.clean = true
      parallel(null, this.handlers, code, (err) => this.completed(err, code))
    }
  }

  /**
   *
   *
   * @memberof GracefulShutdown
   */
  init () {
    process.on('cleanup', code => {
      this.shutdown(code)
    })

    // when the Node.js event loop no longer having any additional work to perform
    // when the process.exit() method being called explicitly
    process.on('exit', function (code) {
      process.emit('cleanup', code)
    })

    this.signals.forEach((code) => {
      process.on(code, () => {
        this.shutdown(code)
      })
    })
  }
}
module.exports = GracefulShutdown
