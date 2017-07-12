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

/**
 *
 *
 * @class BeforeExit
 */
class BeforeExit {
  /**
   * Creates an instance of BeforeExit.
   * @memberof BeforeExit
   */
  constructor () {
    this.actions = []
    this.signals = ['SIGINT', 'SIGTERM']
  }

  /**
   *
   *
   * @param {any} fn
   * @memberof BeforeExit
   */
  addAction (fn) {
    if (!_.isFunction(fn)) {
      throw new Error('Expected a function but got a ' + typeof fn)
    }
    this.actions.push(fn)
  }

  /**
   *
   *
   * @param {any} signal
   * @memberof BeforeExit
   */
  doActions (signal) {
    Promise.all(this.actions.map(action => action(signal))).then(() => {
      process.exit(0)
    }).catch(() => {
      process.exit(1)
    })
  }

  /**
   *
   *
   * @memberof BeforeExit
   */
  init () {
    this.signals.forEach((signal) => {
      process.on(signal, () => {
        this.doActions(signal)
      })
    })

    // PM2 Cluster shutdown message. Caught to support async handlers with pm2, needed because
    // explicitly calling process.exit() doesn't trigger the beforeExit event, and the exit
    // event cannot support async handlers, since the event loop is never called after it.
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        this.doActions('shutdown')
      }
    })
  }
}
module.exports = BeforeExit
