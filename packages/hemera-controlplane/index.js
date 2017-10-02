'use strict'

const Hp = require('hemera-plugin')
const fork = require('child_process').fork
const Os = require('os')

let workers = []
const cpuCount = Os.cpus().length

exports.plugin = Hp(hemeraControlplane, '>=1.5.0')

exports.options = {
  name: require('./package.json').name,
  payloadValidator: 'hemera-joi'
}

function hemeraControlplane(hemera, opts, done) {
  const topic = 'controlplane'
  const Joi = hemera.joi

  // name of the service is required
  const result = Joi.validate(
    opts,
    { service: Joi.string().required() },
    { allowUnknown: true }
  )

  if (result.error !== null) {
    throw result.error
  }

  // IPC
  process.on('message', m => {
    if (m.plugin === 'controlplane') {
      if (m.cmd === 'exit') {
        process.send({
          plugin: 'controlplane',
          event: 'exit',
          pid: process.pid
        })
        hemera.fatal()
      }
    }
  })

  // send online status in child process
  if (process.send) {
    process.send({ plugin: 'controlplane', event: 'online', pid: process.pid })
  }

  function removeWorkerByPid(workers, pid) {
    const workerIndex = workers.findIndex(p => {
      return p.pid === pid
    })
    if (workerIndex > -1) {
      workers[workerIndex].removeAllListeners()
      workers.splice(workerIndex, 1)
    }
  }

  hemera.add(
    {
      topic,
      cmd: 'scaleUp',
      service: opts.service
    },
    function(req, reply) {
      // limit forks by count of processors
      if (workers.length < cpuCount) {
        // script must be passed as second argument
        const worker = fork(process.argv[1])

        // wait until process is ready
        worker.once('message', m => {
          this.log.debug('IPC received!')
          if (m.plugin === 'controlplane') {
            if (m.event === 'online') {
              this.log.debug(`Scale Up. PID(${m.pid})`)
              workers.push(worker)
              reply(null, { success: true, pid: m.pid })
            }
          }
        })

        worker.once('exit', code => {
          removeWorkerByPid(workers, worker.pid)
        })
        worker.once('error', code => {
          reply(null, { success: false, code, pid: worker.pid })
        })
      } else {
        reply(null, { success: false, msg: 'limit reached' })
      }
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'scaleDown',
      service: opts.service
    },
    function(req, reply) {
      const worker = workers.shift()
      if (worker) {
        // wait until process was terminated
        worker.once('message', m => {
          this.log.debug('IPC received!')
          if (m.plugin === 'controlplane') {
            if (m.event === 'exit') {
              this.log.debug(`Scale down. PID(${m.pid})`)
              removeWorkerByPid(workers, m.pid)
              reply(null, { success: true, pid: m.pid })
            }
          }
        })

        worker.once('exit', code => {
          removeWorkerByPid(workers, worker.pid)
        })
        worker.once('error', code => {
          reply(null, { success: false, code, pid: worker.pid })
        })

        // send ipc command
        worker.send({ plugin: topic, cmd: 'exit' })
      } else {
        reply(null, { success: false, msg: 'worker not found' })
      }
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'killByPid',
      service: opts.service,
      pid: Joi.number().required()
    },
    function(req, reply) {
      const workerIndex = workers.findIndex(p => {
        return p.pid === req.pid
      })

      if (workerIndex > -1) {
        const worker = workers[workerIndex]

        // wait until process was terminated
        worker.once('message', m => {
          this.log.debug('IPC received!')
          if (m.plugin === 'controlplane') {
            if (m.event === 'exit') {
              this.log.debug(`Scale down. PID(${m.pid})`)
              removeWorkerByPid(workers, worker.pid)
              reply(null, { success: true, pid: m.pid })
            }
          }
        })

        worker.once('exit', code => {
          removeWorkerByPid(workers, worker.pid)
        })
        worker.once('error', code => {
          reply(null, { success: false, code, pid: worker.pid })
        })

        worker.send({ plugin: topic, cmd: 'exit' })
      } else {
        reply(null, {
          success: false,
          pid: req.pid,
          reason: 'Worker not found!'
        })
      }
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'down',
      service: opts.service
    },
    function(req, reply) {
      const self = this
      function kill(workers) {
        const worker = workers.shift()

        if (worker) {
          // wait until process was terminated
          worker.once('message', m => {
            self.log.debug('IPC received!')

            if (m.plugin === 'controlplane') {
              if (m.event === 'exit') {
                self.log.debug(`Scale down. PID(${m.pid})`)
                worker.removeAllListeners()
                // continue
                kill(workers)
              }
            }
          })

          worker.once('error', code => {
            self.log.error(
              `Worker could not be killed. PID(${worker.pid}), CODE(${code})`
            )
            // continue
            kill(workers)
          })

          // kill
          worker.send({ plugin: topic, cmd: 'exit' })
        } else {
          self.log.debug('All workers killed!')
          reply(null, { success: true })
        }
      }

      // start
      kill(workers)
    }
  )

  hemera.add(
    {
      topic,
      cmd: 'list',
      service: opts.service
    },
    function(req, reply) {
      const list = workers.map(item => item.pid)
      reply(null, { success: true, list })
    }
  )

  done()
}
