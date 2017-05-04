'use strict'

const fork = require('child_process').fork
const Os = require('os')

const workers = []
const forkCount = 0
const cpuCount = Os.cpus().length

exports.plugin = function hemeraZipkin (options) {
  const hemera = this
  const topic = 'controlplane'
  const Joi = hemera.exposition['hemera-joi'].joi
  const WorkerNotFoundError = hemera.createError('WorkerNotFoundError')

  // name of the service is required
  const result = Joi.validate(options, { service: Joi.string().required() }, { allowUnknown: true })

  if (result.error !== null) {
    throw result.error
  }

  hemera.add({
    topic,
    cmd: 'scaleUp',
    service: options.service
  }, function (req, reply) {
    // limit forks by count of processors
    if (forkCount <= cpuCount) {
      // script must be passed as second argument
      const worker = fork(process.argv[1])

      worker.on('exit', (code) => {
        hemera.emit(`${topic}.exit`, code)
      })
      worker.on('error', (code) => {
        hemera.emit(`${topic}.error`, code)
      })

      this.log.debug(`Scale Up. PID(${worker.pid})`)
      workers.push(worker)
      reply(null, { success: true, pid: worker.pid })
    } else {
      reply(null, { success: false })
    }
  })

  hemera.add({
    topic,
    cmd: 'scaleDown',
    service: options.service
  }, function (req, reply) {
    const worker = workers.shift()
    if (worker) {
      this.log.debug(`Scale down. PID(${worker.pid})`)
      worker.kill()
      reply(null, { success: true, pid: worker.pid })
    } else {
      reply(null, { success: false })
    }
  })

  hemera.add({
    topic,
    cmd: 'exitByPid',
    service: options.service,
    pid: Joi.number().required()
  }, function (req, reply) {
    const worker = workers.filter(x => x.pid === req.pid)
    if (worker) {
      this.log.debug(`Killed PID(${worker.pid})`)
      worker.kill()
      reply(null, { success: true, pid: worker.pid })
    } else {
      reply(new WorkerNotFoundError('Worker not found!'))
    }
  })

  hemera.add({
    topic,
    cmd: 'down',
    service: options.service
  }, function (req, reply) {
    workers.forEach(x => x.kill())
    this.log.debug('All workers killed!')
    reply(null, { success: true })
  })

  hemera.add({
    topic,
    cmd: 'list',
    service: options.service
  }, function (req, reply) {
    const list = workers.map(item => item.pid)
    reply(null, { success: true, list })
  })
}

exports.options = {
  payloadValidator: 'hemera-joi'
}

exports.attributes = {
  dependencies: ['hemera-joi'],
  pkg: require('./package.json')
}
