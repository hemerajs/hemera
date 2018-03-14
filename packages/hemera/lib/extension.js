'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const _ = require('lodash')
const Constants = require('./constants')
const Errors = require('./errors')

/**
 * @class Extension
 */
class Extension {
  constructor() {
    this._stack = []
    this._types = [
      'onClientPreRequest',
      'onClientPostRequest',
      'onServerPreHandler',
      'onServerPreRequest',
      'onServerPreResponse'
    ]
    this.onClientPreRequest = []
    this.onClientPostRequest = []

    this.onServerPreHandler = []
    this.onServerPreRequest = []
    this.onServerPreResponse = []
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberof Extension
   */
  _add(type, handler) {
    if (this._types.indexOf(type) === -1) {
      let error = new Errors.HemeraError(Constants.INVALID_EXTENSION, {
        type,
        handler
      })
      throw error
    }

    this[type].push(handler)
  }

  /**
   *
   *
   * @param {any} handler
   *
   * @memberOf Extension
   */
  add(type, handler) {
    if (_.isArray(handler)) {
      handler.forEach(h => this._add(type, h))
    } else {
      this._add(type, handler)
    }
  }
}

module.exports = Extension
