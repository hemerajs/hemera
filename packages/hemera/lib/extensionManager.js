'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Errors = require('./errors')

class ExtensionManager {
  constructor() {
    this._stack = []
    this._types = [
      'onAct',
      'onActFinished',
      'preHandler',
      'onRequest',
      'onSend',
      'onResponse'
    ]
    this.onAct = []
    this.onActFinished = []

    this.preHandler = []
    this.onRequest = []
    this.onResponse = []
    this.onSend = []
  }

  _add(type, handler) {
    if (this._types.indexOf(type) === -1) {
      let error = new Errors.HemeraError('Extension type is unknown', {
        type,
        handler
      })
      throw error
    }

    this[type].push(handler)
  }

  add(type, handler) {
    if (Array.isArray(handler)) {
      handler.forEach(h => this._add(type, h))
    } else {
      this._add(type, handler)
    }
  }

  static build(e) {
    const extensions = new ExtensionManager()
    extensions.onAct = e.onAct.slice()
    extensions.onActFinished = e.onActFinished.slice()

    extensions.preHandler = e.preHandler.slice()
    extensions.onRequest = e.onRequest.slice()
    extensions.onSend = e.onSend.slice()
    extensions.onResponse = e.onResponse.slice()

    return extensions
  }
}

module.exports = ExtensionManager
