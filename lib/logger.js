/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

'use strict'

/**
 * Module Dependencies
 */

const
  Hoek = require('hoek'),
  Pino = require('pino'),
  Pretty = Pino.pretty()


//Config
var defaultConfig = {
  level: 'silent',
  levels: ['info', 'warn', 'debug', 'trace', 'error', 'fatal']
}

/**
 * 
 * 
 * @class Logger
 */
class Logger {

  constructor(params) {

      let self = this

      self.config = Hoek.applyToDefaults(defaultConfig, params || {})

      //Leads to too much listeners in tests
      if (this.config.level !== 'silent') {
        Pretty.pipe(process.stdout)
      }

      this.logger = Pino({
        name: 'app',
        safe: true,
        level: this.config.level
      }, Pretty)

      //Set levels, create new prototype methods
      self.config.levels.forEach((level) => {

        self[level] = function (msg) {

          let args = [level].concat(Array.prototype.slice.call(arguments))
          self.log.apply(self, args)
        }
      })

    }
    /**
     * 
     * 
     * @param {any} level
     * @param {any} msg
     * @param {any} data
     * 
     * @memberOf Logger
     */
  log() {

    this.logger[arguments[0]].apply(this.logger, Array.prototype.slice.call(arguments).slice(1))
  }

}

module.exports = Logger