'use strict'

const Parambulator = require('parambulator')

exports.plugin = function hemeraParambulator() {

  var hemera = this

  hemera.ext('onServerPreHandler', function (next) {

    let schema = this._actMeta.schema
    let pattern = this._request.value.pattern

    let paramcheck = Parambulator(schema)
    paramcheck.validate(pattern, (err) => {

      next(err)
    })

  })

}

exports.options = {
}

exports.attributes = {
  name: 'hemera-parambulator'
}
