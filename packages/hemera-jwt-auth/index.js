'use strict'

const Hp = require('hemera-plugin')
const JWT = require('jsonwebtoken')
const Hoek = require('hoek')

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

exports.plugin = Hp(function hemeraJwtAuth (options) {
  const hemera = this

  const JwtError = hemera.createError('JwtError')

  hemera.ext('onServerPreHandler', function (ctx, req, res, next) {
    // Get auth from server method
    const auth = ctx._actMeta.schema.auth$

    // Disable auth when it was set explicit
    if (auth && auth.enabled === false) {
      return next()
    }

    // If auth was not set and disabled by default
    if (!auth && options.enforceAuth === false) {
      return next()
    }

    JWT.verify(ctx.meta$.jwtToken, options.jwt.secret, options.jwt.options, (err, decoded) => {
      if (err) {
        return next(err)
      }
      // Make accessible in server method context
      ctx.auth$ = decoded
      if (typeof auth === 'object') {
        // Support single scope
        if (typeof auth.scope === 'string') {
          auth.scope = [auth.scope]
        }
        // Check if scope is subset
        if (isSubset(decoded.scope, auth.scope)) {
          return next()
        }
        // Invalid scope return error
        return res.end(new JwtError('Invalid scope'))
      } else {
        // Invalid auth options return error
        return res.end(new JwtError('Invalid auth$ options'))
      }
    })
  })
})

exports.options = {
  enforceAuth: true,
  jwt: {
    secret: false
  }
}

exports.attributes = {
  pkg: require('./package.json')
}
