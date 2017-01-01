'use strict'

const Arangojs = require('arangojs')

exports.plugin = function hemeraArango(options) {

  const hemera = this

  let db = Arangojs(options.arango)

  hemera.add({
    topic: 'arango-store',
    type: 'one',
    cmd: 'aql'
  }, function (req, cb) {

    db.query(req.query, req.variables).then((cursor) => {

      if (cursor.hasNext()) {

        cursor.next()
          .then(value => {
            cb(null, value)
          })
      } else {

        cb()
      }

    }).catch((err) => {

      cb(err)
    })

  })

  hemera.add({
    topic: 'arango-store',
    type: 'all',
    cmd: 'aql'
  }, function (req, cb) {

    db.query(req.query, req.variables).then((cursor) => {

      if (cursor.hasNext()) {

        cursor.all()
          .then(value => {
            cb(null, value)
          })
      } else {

        cb()
      }

    }).catch((err) => {

      cb(err)
    })

  })

}

exports.options = {
  arango: null,
}

exports.attributes = {
  name: 'hemera-arango'
}
