'use strict'

if (Number(process.versions.node[0]) >= 8) {
  require('./async-await')
  require('./plugin.async-await.spec')
}
