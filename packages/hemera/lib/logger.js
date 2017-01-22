// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

import Hoek from 'hoek'
import Pino from 'pino'

const Pretty = Pino.pretty()


//Config
let defaultConfig = {
  level: 'silent',
  levels: ['info', 'warn', 'debug', 'trace', 'error', 'fatal']
}

/**
 * @class Logger
 */
class Logger {

  _config: any;
  _logger: any;
  /**
   * Creates an instance of Logger.
   *
   * @param {any} params
   *
   * @memberOf Logger
   */
  constructor(params: {
    level: string
  }) {

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

      let that: {
        [id: string]: Function
      } = this

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
