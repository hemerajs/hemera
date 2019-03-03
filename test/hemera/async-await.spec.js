'use strict'

if (Number(process.versions.node.split('.')[0]) >= 8) {
  require('./async-await')
  require('./plugin.async-await')
  require('./middleware.async-await')
}
