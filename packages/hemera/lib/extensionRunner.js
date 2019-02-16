'use strict'

function extRunner(functions, runner, state, cb) {
  let i = 0

  function next(err) {
    if (err || i === functions.length) {
      cb(err)
      return
    }

    const result = runner(functions[i++], state, next)
    if (result && typeof result.then === 'function') {
      // avoid to create a seperate promise
      // eslint-disable-next-line promise/catch-or-return
      result.then(handleResolve, handleReject)
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

function responseExtIterator(fn, state, next) {
  return fn(state, state.reply, next)
}

function serverExtIterator(fn, state, next) {
  return fn(state, state.request, state.reply, next)
}

function serverOnErrorIterator(fn, state, next) {
  return fn(state, state.reply.payload, state.reply.error, next)
}

function clientExtIterator(fn, state, next) {
  return fn(state, next)
}

module.exports = {
  extRunner,
  serverExtIterator,
  clientExtIterator,
  responseExtIterator,
  serverOnErrorIterator
}
