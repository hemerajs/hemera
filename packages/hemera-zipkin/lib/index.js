'use strict'

var HttpSimpleTransport = require('./transports/http-simple')
var HttpBatchTransport = require('./transports/http-batch')

var TO_MICROSECONDS = 1000
var ID_LENGTH = 16
var ID_DIGITS = '0123456789abcdef'

var DEFAULT_OPTIONS = {
  sampling: 0.1,
  debug: false,
  host: '127.0.0.1',
  port: '9411',
  path: '/api/v1/spans'
}


function generateTimestamp() {
  return new Date().getTime() * TO_MICROSECONDS
}

function generateId() {
  // copied over from zipkin-js
  var n = ''
  for (var i = 0; i < ID_LENGTH; i++) {
    var rand = Math.floor(Math.random() * ID_DIGITS.length)

    // avoid leading zeroes
    if (rand !== 0 || n.length > 0) {
      n += ID_DIGITS[rand]
    }
  }
  return n
}

function zipkinSimple(options) {
  this.counter = 0
  this.opts = Object.assign({}, DEFAULT_OPTIONS, options)
  this.buildOptions()
}

zipkinSimple.prototype.buildOptions = function buildOptions() {
  this.send = HttpBatchTransport

  if (this.opts.transport === 'http-simple') {
    this.send = HttpSimpleTransport
  }

  if (typeof this.opts.transport === 'function') {
    this.send = this.opts.transport
  }
}

zipkinSimple.prototype.shouldSample = function shouldSample() {
  this.counter++

    if (this.counter * this.opts.sampling >= 1) {
      this.counter = 0
      return true
    }

  return false
}

zipkinSimple.prototype.createRootTrace = function createRootTrace() {
  var id = generateId()

  return {
    traceId: id,
    spanId: id,
    parentSpanId: null,
    sampled: this.shouldSample(),
    timestamp: generateTimestamp()
  }
}

zipkinSimple.prototype.getChild = function getChild(traceData) {
  if (!traceData) {
    return this.createRootTrace()
  }

  return {
    traceId: traceData.traceId,
    parentSpanId: traceData.spanId,
    spanId: generateId(),
    sampled: traceData.sampled,
    timestamp: generateTimestamp()
  }
}

zipkinSimple.prototype.sendTrace = function sendTrace(trace, data) {
  if (!trace.sampled) {
    return
  }

  var body = {
    traceId: trace.traceId,
    name: data.name,
    id: trace.spanId,
    annotations: [],
    binaryAnnotations: []
  }

  if (trace.parentSpanId) {
    body.parentId = trace.parentSpanId
  }

  var time = generateTimestamp()
  for (var i = 0; i < data.annotations.length; i++) {
    body.annotations.push({
      endpoint: {
        serviceName: data.service,
        ipv4: 0,
        port: 0
      },
      timestamp: time,
      value: data.annotations[i]
    })

    if (data.annotations[i] === 'cr' || (data.annotations[i] === 'ss' && trace.serverOnly)) {
      body.duration = time - trace.timestamp
    }

    if (data.annotations[i] === 'cs' || (data.annotations[i] === 'sr' && trace.serverOnly)) {
      body.timestamp = trace.timestamp || generateTimestamp()
    }
  }

  this.send(body, this.opts)
}

zipkinSimple.prototype.traceWithAnnotation = function traceWithAnnotation(trace, data, annotation) {
  if (!trace) {
    trace = this.createRootTrace()
  }

  if (!trace.sampled) {
    return trace
  }

  data.annotations = data.annotations || []
  data.annotations.push(annotation)
  this.sendTrace(trace, data)

  return trace
}

zipkinSimple.prototype.sendClientSend = function sendClientSend(trace, data) {
  return this.traceWithAnnotation(trace, data, 'cs')
}

zipkinSimple.prototype.sendClientRecv = function sendClientRecv(trace, data) {
  return this.traceWithAnnotation(trace, data, 'cr')
}

zipkinSimple.prototype.sendServerSend = function sendServerSend(trace, data) {
  return this.traceWithAnnotation(trace, data, 'ss')
}

zipkinSimple.prototype.sendServerRecv = function sendServerRecv(trace, data) {
  if (!trace) {
    trace = this.createRootTrace()
    trace.serverOnly = true
  }

  return this.traceWithAnnotation(trace, data, 'sr')
}

zipkinSimple.prototype.options = function setOptions(opts) {
  if (opts) {
    Object.assign(this.opts, opts)
    this.buildOptions()
  }

  return this.opts
}

zipkinSimple.prototype.get_child = zipkinSimple.prototype.getChild
zipkinSimple.prototype.send_client_send = zipkinSimple.prototype.sendClientSend
zipkinSimple.prototype.send_client_recv = zipkinSimple.prototype.sendClientRecv
zipkinSimple.prototype.send_server_send = zipkinSimple.prototype.sendServerSend
zipkinSimple.prototype.send_server_recv = zipkinSimple.prototype.sendServerRecv

module.exports = zipkinSimple
