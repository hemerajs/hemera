'use strict'
const os = require('os')

console.log('Platform info:')
console.log('==============')

console.log('  ', os.type() + ' ' + os.release() + ' ' + os.arch())
console.log('  ', 'Node.JS:', process.versions.node)
console.log('  ', 'V8:', process.versions.v8)

let cpus = os
  .cpus()
  .map(function(cpu) {
    return cpu.model
  })
  .reduce(function(o, model) {
    if (!o[model]) o[model] = 0
    o[model]++
    return o
  }, {})

cpus = Object.keys(cpus)
  .map(function(key) {
    return key + ' \u00d7 ' + cpus[key]
  })
  .join('\n')

console.log('  ', cpus)
