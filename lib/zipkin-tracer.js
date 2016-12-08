/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * Module Dependencies
 */

const {
  Annotation,
  Tracer,
  BatchRecorder,
  ExplicitContext,
  TraceId,
  option: {
    Some,
    None
  }
} = require('zipkin'),
  Hoek = require('hoek')

const {
  HttpLogger
} = require('zipkin-transport-http')

const ctxImpl = new ExplicitContext()

//Config
var defaultConfig = {
  serverName: '',
  clientName: '',
  httpLogger: {
    endpoint: 'http://127.0.0.1:9411/api/v1/spans'
  }
}

/**
 * @class Logger
 */
class ZipkinTracer {


  constructor(params) {

    this._config = Hoek.applyToDefaults(defaultConfig, params || {})
    this._recorder = new BatchRecorder({
      logger: new HttpLogger(this._config.httpLogger)
    })
    this._tracer = new Tracer({
      recorder: this._recorder,
      ctxImpl
    })

  }

  /**
   * @param {any} val
   * @returns
   * 
   * @memberOf ZipkinTracer
   */
  wrapValue(val) {

    if (val != null) {

      return new Some(val)
    } else {

      return None
    }
  }

  /**     
   * @param {any} traceId
   * @param {any} parentSpanId
   * @param {any} spanId
   * @param {any} service
   * @param {any} method
   * @returns
   * 
   * @memberOf ZipkinTracer
   */
  serverRecv(obj) {

    const id = new TraceId({
      traceId: this.wrapValue(obj.traceId),
      parentId: this.wrapValue(obj.parentSpanId),
      spanId: obj.spanId
    })

    this._tracer.setId(id)
    this._tracer.recordServiceName(obj.service)
    this._tracer.recordRpc(obj.method)
    this._tracer.recordBinary('serverName', this._config.serverName)
    this._tracer.recordAnnotation(new Annotation.ServerRecv())

    return id
  }

  /**    
   * @param {any} id
   * 
   * @memberOf ZipkinTracer
   */
  serverSend(id) {

    this._tracer.setId(id)
    this._tracer.recordBinary('serverName', this._config.serverName)
    this._tracer.recordAnnotation(new Annotation.ServerSend())
  }

  /**
   * @param {any} traceId
   * @param {any} parentSpanId
   * @param {any} spanId
   * 
   * @memberOf ZipkinTracer
   */
  clientSend(obj) {

    const id = new TraceId({
      traceId: this.wrapValue(obj.traceId),
      parentId: this.wrapValue(obj.parentSpanId),
      spanId: obj.spanId
    })

    this._tracer.setId(id)
    this._tracer.recordServiceName(obj.service)
    this._tracer.recordRpc(obj.method)
    this._tracer.recordBinary('clientName', this._config.clientName)
    this._tracer.recordAnnotation(new Annotation.ClientSend())

    return id
  }

  /**
   * @param {any} id
   * 
   * @memberOf ZipkinTracer
   */
  clientRecv(id) {

    this._tracer.setId(id)
    this._tracer.recordBinary('clientName', this._config.clientName)
    this._tracer.recordAnnotation(new Annotation.ClientRecv())
  }

  /**
   * @param {any} id
   * @param {any} error
   * 
   * @memberOf ZipkinTracer
   */
  serverErrorRecv(id, error) {

    this._tracer.setId(id)
    this._tracer.recordBinary('serverName', this._config.serverName)
    this._tracer.recordBinary('error', error.message)
    this._tracer.recordAnnotation(new Annotation.ServerRecv())
  }

  /**
   * @param {any} id
   * @param {any} error
   * 
   * @memberOf ZipkinTracer
   */
  clientErrorRecv(id, error) {

    this._tracer.setId(id)
    this._tracer.recordBinary('clientName', this._config.clientName)
    this._tracer.recordBinary('error', error.message)
    this._tracer.recordAnnotation(new Annotation.ClientRecv())
  }
}

module.exports = ZipkinTracer