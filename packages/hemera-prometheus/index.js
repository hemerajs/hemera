'use strict'

const Prom = require('prom-client')
const Express = require('express')
const Hp = require('hemera-plugin')

function hemeraPrometheus(hemera, opts, done) {
  const server = Express()

  hemera.decorate('prom', Prom)
  hemera.decorate('express', server)

  if (opts.collectDefaultMetrics) {
    // Enable collection of default metrics
    Prom.collectDefaultMetrics()
    // Expose default metrics on public http endpoint
    server.get('/metrics', (req, res) => {
      res.set('Content-Type', Prom.register.contentType)
      res.end(Prom.register.metrics())
    })
  }

  // Expose a single metric on http endpoint
  hemera.decorate('exposeMetric', metric => {
    if (typeof metric !== 'string') {
      const err = new Error(
        `Metric name must be from type string but got ${typeof metric}`
      )
      hemera.log.error(err)
      throw err
    }

    server.get('/metrics/' + metric, (req, res) => {
      res.set('Content-Type', Prom.register.contentType)
      res.end(Prom.register.getSingleMetricAsString(metric))
    })
  })

  // Gracefully shutdown
  hemera.ext('onClose', (ctx, done) => {
    server.close()
    done()
  })

  server.listen(opts.httpServer.port, opts.httpServer.host, done)
}

const plugin = Hp(hemeraPrometheus, {
  hemera: '^3.0.0',
  name: require('./package.json').name,
  options: {
    collectDefaultMetrics: true,
    httpServer: {
      port: 3000,
      hostname: '127.0.0.1'
    }
  }
})

module.exports = plugin
