'use strict'

const JWT = require('jsonwebtoken')
const Hoek = require('hoek')
const SuperError = require('super-error')
const JwtError = SuperError.subclass('JwtError')

/**
 *
 *
 * @param {any} scope
 * @param {any} subset
 * @returns
 */
function isSubset (scope, subset) {
  if (!scope) {
    return false
  }

  if (scope.length < subset.length) {
    return false
  }

  const common = Hoek.intersect(scope, subset)
  return common.length === subset.length
}

exports.plugin = function hemeraJwtAuth (options) {
  const hemera = this

  hemera.ext('onServerPreHandler', function (req, res, next, prevValue, i) {
    const ctx = this

    // get auth from server method
    const auth = ctx._actMeta.schema.auth$

    // if no token was passed or auth is disabled we can continue
    if (!ctx.meta$.jwtToken) {
      return next()
    } else if (auth && auth.enabled === false) {
      return next()
    }

    JWT.verify(ctx.meta$.jwtToken, options.jwt.secret, options.jwt.options, (err, decoded) => {
      if (err) {
        return next(err)
      }
      // make accessible in server method context
      ctx.auth$ = decoded
      // get scopes from server method
      const auth = ctx._actMeta.schema.auth$
      if (typeof auth === 'object') {
        // support single scope
        if (typeof auth.scope === 'string') {
          auth.scope = [auth.scope]
        }
        // check if scope is subset
        if (isSubset(auth.scope, decoded.scope)) {
          return next()
        }
        // invalid scope return error
        return res.end(new JwtError('Invalid scope'))
      } else {
        // invalid auth options return error
        return res.end(new JwtError('Invalid auth$ options'))
      }
    })
  })
}

exports.options = {
  jwt: {
    secret: false
  }
}

exports.attributes = {
  name: 'hemera-jwt-auth'
}
