'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

class Plugin {
  constructor (plugin) {
    this.attributes = plugin.attributes || {}
    this.options = plugin.options
    this.parentPluginName = plugin.parentPluginName
    this.register = plugin.register
  }
}

module.exports = Plugin
