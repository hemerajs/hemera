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
  constructor(logger) {
    this.logger = logger
    this.process = null
    this.handlers = []
    this.timeout = 10000
    this.signals = ['SIGINT', 'SIGTERM']
  }

  /**
   *
   *
   * @param {any} fn
   * @memberof GracefulShutdown
   */
  addHandler(fn) {
    if (typeof fn !== 'function') {
      throw new Error(`Expected a function but got a ${typeof fn}`)
    }

    this.handlers.push(fn)
  }

  /**
   *
   *
   * @param {any} err
   * @param {any} signal
   * @memberof GracefulShutdown
   */
  completed(err, signal) {
    if (err) {
      this.logger.error({ err, signal }, 'process terminated')
      this.process.exit(1)
    } else {
      this.logger.info({ signal }, 'process terminated')
      this.process.exit(0)
    }
  }

  /**
   *
   *
   * @param {any} signal
   * @param {any} timeout
   * @memberof GracefulShutdown
   */
  terminateAfterTimeout(signal, timeout) {
    setTimeout(() => {
      this.logger.error({ signal, timeout }, 'terminate process after timeout')
      this.process.exit(1)
    }, timeout).unref()
  }

  /**
   *
   *
   * @param {any} signal
   * @memberof GracefulShutdown
   */
  shutdown(signal) {
    parallel(null, this.handlers, signal, err => this.completed(err, signal))
  }

  /**
   *
   *
   * @param {any} signal
   * @memberof GracefulShutdown
   */
  sigHandler(signal) {
    this.terminateAfterTimeout(signal, this.timeout)
    this.shutdown(signal)
  }

  /**
   *
   *
   * @memberof GracefulShutdown
   */
  init() {
    this.signals.forEach(signal => {
      if (this.process.listenerCount(signal) > 0) {
        this.logger.warn(`${signal} handler was already registered`)
      }
      this.process.once(signal, () => this.sigHandler(signal))
    })
  }
}
module.exports = GracefulShutdown
