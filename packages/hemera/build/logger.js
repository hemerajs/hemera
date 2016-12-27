//      

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
 * @class Logger
 */
class Logger {

               
               
  /**
   * Creates an instance of Logger.
   *
   * @param {any} params
   *
   * @memberOf Logger
   */
  constructor(params                   ) {

    let self = this

    self._config = Hoek.applyToDefaults(defaultConfig, params || {})

    //Leads to too much listeners in tests
    if (this._config.level !== 'silent') {
      Pretty.pipe(process.stdout)
    }

    this._logger = Pino({
      name: 'app',
      safe: true,
      level: this._config.level
    }, Pretty)

    //Set levels, create new prototype methods
    self._config.levels.forEach((level) => {

      let that                             = this

      that[level] = function () {

        let args = [level].concat(Array.prototype.slice.call(arguments))
        self.log.apply(self, args)
      }
    })

  }

  /**
   * @memberOf Logger
   */
  log() {

    this._logger[arguments[0]].apply(this._logger,
      Array.prototype.slice.call(arguments).slice(1))
  }
}

module.exports = Logger
