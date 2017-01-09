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
  attributes: {
    private: true //All hemera extension will be marked as scoped. You can use different extensions per plugin
  }
}

exports.attributes = {
  name: 'hemera-parambulator'
}
