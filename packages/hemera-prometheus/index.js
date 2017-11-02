'use strict'

const Prom = require('prom-client')
const Express = require('express')
const Hp = require('hemera-plugin')

exports.plugin = Hp(hemeraPrometheus, '>=2.0.0')

exports.options = {
  name: require('./package.json').name,
  collectDefaultMetrics: true,
  httpServer: {
    port: 3000,
    hostname: '127.0.0.1'
  }
}

function hemeraPrometheus(hemera, opts, done) {
  const server = Express()

  hemera.decorate('prom', Prom)
  hemera.decorate('httpServer', server)

  if (opts.collectDefaultMetrics) {
    // Enable collection of default metrics
    Prom.collectDefaultMetrics()
  }

  // Expose a single metric on http endpoint
  hemera.decorate('exposeMetric', metric => {
    server.get('/metrics/' + metric, (req, res) => {
      res.set('Content-Type', Prom.register.contentType)
      res.end(Prom.register.getSingleMetricAsString(metric))
    })
  })

  // Expose default metrics on http endpoint
  server.get('/metrics', (req, res) => {
    res.set('Content-Type', Prom.register.contentType)
    res.end(Prom.register.metrics())
  })

  // Gracefully shutdown
  hemera.ext('onClose', (ctx, done) => {
    server.close()
    done()
  })

  server.listen(opts.httpServer.port, opts.httpServer.host, done)
}
