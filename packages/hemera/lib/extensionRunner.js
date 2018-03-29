'use strict'

function extRunner(functions, runner, state, cb) {
  var i = 0

  function next(err) {
    if (err || i === functions.length) {
      cb(err)
      return
    }

    const result = runner(functions[i++], state, next)
    if (result && typeof result.then === 'function') {
      result.then(handleResolve).catch(handleReject)
    }
  }

  function handleResolve() {
    next()
  }

  function handleReject(err) {
    cb(err)
  }

  next()
}

function serverExtIterator(fn, state, next) {
  return fn(state, state.request, state.reply, next)
}

function clientExtIterator(fn, state, next) {
  return fn(state, next)
}

module.exports = { extRunner, serverExtIterator, clientExtIterator }
