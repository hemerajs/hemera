'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bloomrun = require('bloomrun');

var _bloomrun2 = _interopRequireDefault(_bloomrun);

var _errio = require('errio');

var _errio2 = _interopRequireDefault(_errio);

var _hoek = require('hoek');

var _hoek2 = _interopRequireDefault(_hoek);

var _heavy = require('heavy');

var _heavy2 = _interopRequireDefault(_heavy);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _pino = require('pino');

var _pino2 = _interopRequireDefault(_pino);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

var _extension = require('./extension');

var _extension2 = _interopRequireDefault(_extension);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _extensions = require('./extensions');

var _extensions2 = _interopRequireDefault(_extensions);

var _encoder = require('./encoder');

var _encoder2 = _interopRequireDefault(_encoder);

var _decoder = require('./decoder');

var _decoder2 = _interopRequireDefault(_decoder);

var _serverResponse = require('./serverResponse');

var _serverResponse2 = _interopRequireDefault(_serverResponse);

var _serverRequest = require('./serverRequest');

var _serverRequest2 = _interopRequireDefault(_serverRequest);

var _clientRequest = require('./clientRequest');

var _clientRequest2 = _interopRequireDefault(_clientRequest);

var _clientResponse = require('./clientResponse');

var _clientResponse2 = _interopRequireDefault(_clientResponse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

/**
 * Module Dependencies
 */

var defaultConfig = {
  timeout: 2000,
  debug: false,
  name: 'app',
  crashOnFatal: true,
  logLevel: 'silent',
  load: {
    sampleInterval: 0
  }
};

/**
 * @class Hemera
 */

var Hemera = function (_EventEmitter) {
  _inherits(Hemera, _EventEmitter);

  /**
   * Creates an instance of Hemera
   *
   * @param {Nats} transport
   * @param {Config} params
   *
   * @memberOf Hemera
   */
  function Hemera(transport, params) {
    _classCallCheck(this, Hemera);

    var _this = _possibleConstructorReturn(this, (Hemera.__proto__ || Object.getPrototypeOf(Hemera)).call(this));

    _this._config = _hoek2.default.applyToDefaults(defaultConfig, params || {});
    _this._catalog = (0, _bloomrun2.default)();
    _this._heavy = new _heavy2.default(_this._config.load);
    _this._transport = transport;
    _this._topics = {};
    _this._exposition = {};

    // special variables for the new execution context
    _this.context$ = {};
    _this.meta$ = {};
    _this.delegate$ = {};
    _this.plugin$ = {
      options: {
        payloadValidator: ''
      },
      attributes: {
        name: 'core'
      }
    };
    _this.trace$ = {};
    _this.request$ = {
      duration: 0,
      parentId: '',
      timestamp: 0,
      type: 'request',
      id: ''
    };

    // contains the list of all registered plugins
    // the core is also a plugin
    _this._plugins = {
      core: _this.plugin$.attributes
    };

    _this._encoder = {
      encode: _encoder2.default.encode
    };
    _this._decoder = {
      decode: _decoder2.default.decode
    };

    // define extension points
    _this._extensions = {
      onClientPreRequest: new _extension2.default('onClientPreRequest'),
      onClientPostRequest: new _extension2.default('onClientPostRequest'),
      onServerPreHandler: new _extension2.default('onServerPreHandler', true),
      onServerPreRequest: new _extension2.default('onServerPreRequest', true),
      onServerPreResponse: new _extension2.default('onServerPreResponse', true)
    };

    // start tracking process stats
    _this._heavy.start();

    // will be executed before the client request is executed.
    _this._extensions.onClientPreRequest.addRange(_extensions2.default.onClientPreRequest);
    // will be executed after the client received and decoded the request
    _this._extensions.onClientPostRequest.addRange(_extensions2.default.onClientPostRequest);
    // will be executed before the server received the requests
    _this._extensions.onServerPreRequest.addRange(_extensions2.default.onServerPreRequest);
    // will be executed before the server action is executed
    _this._extensions.onServerPreHandler.addRange(_extensions2.default.onServerPreHandler);
    // will be executed before the server reply the response and build the message
    _this._extensions.onServerPreResponse.addRange(_extensions2.default.onServerPreResponse);

    // use own logger
    if (_this._config.logger) {

      _this.log = _this._config.logger;
    } else {

      var pretty = _pino2.default.pretty();

      //Leads to too much listeners in tests
      if (_this._config.logLevel !== 'silent') {
        pretty.pipe(process.stdout);
      }

      _this.log = (0, _pino2.default)({
        name: _this._config.name,
        safe: true,
        level: _this._config.logLevel
      }, pretty);
    }
    return _this;
  }

  /**
   * Return all registered plugins
   *
   * @readonly
   *
   * @memberOf Hemera
   */


  _createClass(Hemera, [{
    key: 'expose',


    /**
     * Exposed data in context of the current plugin
     * Is accessible by this.expositions[<plugin>][<key>]
     *
     * @param {string} key
     * @param {mixed} object
     *
     * @memberOf Hemera
     */
    value: function expose(key, object) {

      var pluginName = this.plugin$.attributes.name;

      if (!this._exposition[pluginName]) {

        this._exposition[pluginName] = {};
        this._exposition[pluginName][key] = object;
      } else {

        this._exposition[pluginName][key] = object;
      }
    }

    /**
     * Return the underlying NATS driver
     *
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'ext',


    /**
     * Add an extension. Extensions are called in serie and can only pass an error
     * You can work with the current context manipulate something
     *
     * @param {any} type
     * @param {any} handler
     *
     * @memberOf Hemera
     */
    value: function ext(type, handler) {

      if (!this._extensions[type]) {
        var error = new _errors2.default.HemeraError(_constants2.default.INVALID_EXTENSION_TYPE, {
          type
        });
        this.log.error(error);
        throw error;
      }

      this._extensions[type].add(handler);
    }

    /**
     * Use a plugin.
     *
     * @param {any} plugin
     *
     * @memberOf Hemera
     */

  }, {
    key: 'use',
    value: function use(params) {

      if (this._plugins[params.attributes.name]) {
        var error = new _errors2.default.HemeraError(_constants2.default.PLUGIN_ALREADY_IN_USE, {
          plugin: params.attributes.name
        });
        this.log.error(error);
        throw error;
      }

      // create new execution context
      var ctx = this.createContext();
      ctx.plugin$ = {};
      ctx.plugin$.attributes = params.attributes || {};
      ctx.plugin$.attributes.dependencies = params.attributes.dependencies || [];
      ctx.plugin$.options = params.options || {};
      ctx.plugin$.options.payloadValidator = params.options.payloadValidator || '';

      params.plugin.call(ctx, params.options);

      this.log.info(params.attributes.name, _constants2.default.PLUGIN_ADDED);
      this._plugins[params.attributes.name] = ctx.plugin$.attributes;
    }

    /**
     * Change the current plugin configuration
     * e.g to set the payload validator
     *
     * @param {any} options
     *
     * @memberOf Hemera
     */

  }, {
    key: 'setOption',
    value: function setOption(key, value) {

      this.plugin$.options[key] = value;
    }

    /**
     * Change the base configuration.
     *
     *
     * @memberOf Hemera
     */

  }, {
    key: 'setConfig',
    value: function setConfig(key, value) {

      this._config[key] = value;
    }

    /**
     * Exit the process
     *
     * @memberOf Hemera
     */

  }, {
    key: 'fatal',
    value: function fatal() {

      this.close();

      process.exit(1);
    }

    /**
     *
     *
     * @param {Function} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'ready',
    value: function ready(cb) {
      var _this2 = this;

      this._transport.on('connect', function () {

        _this2.log.info(_constants2.default.TRANSPORT_CONNECTED);

        if (_lodash2.default.isFunction(cb)) {
          cb.call(_this2);
        }
      });
    }

    /**
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'timeout',
    value: function timeout() {

      return this.transport.timeout.apply(this.transport, arguments);
    }
    /**
     * Publishing with the NATS driver
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'send',
    value: function send() {

      return this.transport.publish.apply(this.transport, arguments);
    }

    /**
     * Send request with the NATS driver
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'sendRequest',
    value: function sendRequest() {

      return this.transport.request.apply(this.transport, arguments);
    }

    /**
     * Build the final payload for the response
     *
     *
     * @memberOf Hemera
     */

  }, {
    key: '_buildMessage',
    value: function _buildMessage() {

      var result = this._response;

      var message = {
        meta: this.meta$ || {},
        trace: this.trace$ || {},
        request: this.request$,
        result: result.error ? null : result.payload,
        error: result.error ? _errio2.default.toObject(result.error) : null
      };

      var endTime = _util2.default.nowHrTime();
      message.request.duration = endTime - message.request.timestamp;
      message.trace.duration = endTime - message.request.timestamp;

      var m = this._encoder.encode.call(this, message);

      // attach encoding issues
      if (m.error) {

        message.error = _errio2.default.toObject(m.error);
        message.result = null;
      }

      // final response
      this._message = m.value;
    }

    /**
     * Last step before the response is send to the callee.
     * The preResponse extension is invoked and previous errors are evaluated.
     *
     * @memberOf Hemera
     */

  }, {
    key: 'finish',
    value: function finish() {

      var self = this;

      self._extensions.onServerPreResponse.invoke(self, function (err, value) {

        // check if an error was already catched
        if (self._response.error) {

          self.log.error(self._response.error);
        }
        // check for an extension error
        else if (err) {

            var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
            self._response.error = error;
            self.log.error(self._response.error);
          }

        // reply value from extension
        if (value) {

          self._response.payload = value;
        }

        // create message payload
        self._buildMessage();

        // indicates that an error occurs and that the program should exit
        if (self._shouldCrash) {

          // only when we have an inbox othwerwise exit the service immediately
          if (self._replyTo) {

            // send error back to callee
            return self.send(self._replyTo, self._message, function () {

              // let it crash
              if (self._config.crashOnFatal) {

                self.fatal();
              }
            });
          } else if (self._config.crashOnFatal) {

            return self.fatal();
          }
        }

        // reply only when we have an inbox
        if (self._replyTo) {

          return this.send(this._replyTo, self._message);
        }
      });
    }

    /**
     * Attach one handler to the topic subscriber.
     * With subToMany and maxMessages you control NATS specific behaviour.
     *
     * @param {string} topic
     * @param {boolean} subToMany
     * @param {number} maxMessages
     *
     * @memberOf Hemera
     */

  }, {
    key: 'subscribe',
    value: function subscribe(topic, subToMany, maxMessages) {
      var _this3 = this;

      var self = this;

      // avoid duplicate subscribers of the emit stream
      // we use one subscriber per topic
      if (self._topics[topic]) {
        return;
      }

      var handler = function handler(request, replyTo) {

        // create new execution context
        var ctx = _this3.createContext();
        ctx._shouldCrash = false;
        ctx._replyTo = replyTo;
        ctx._request = new _serverRequest2.default(ctx, request);
        ctx._response = new _serverResponse2.default(ctx);
        ctx._pattern = {};
        ctx._actMeta = {};

        self._extensions.onServerPreRequest.invoke(ctx, function (err, value) {

          var self = this;

          if (err) {

            var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
            self.log.error(error);
            self._response.error = error;

            return self.finish();
          }

          // reply value from extension
          if (value) {

            ctx._response.payload = value;
            return self.finish();
          }

          // find matched RPC
          var requestType = self._request.payload.request.type;
          self._pattern = self._request.payload.pattern;
          self._actMeta = self._catalog.lookup(self._pattern);

          // check if a handler is registered with this pattern
          if (self._actMeta) {

            self._extensions.onServerPreHandler.invoke(ctx, function (err, value) {

              if (err) {

                self._response.error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

                self.log.error(self._response.error);

                return self.finish();
              }

              // reply value from extension
              if (value) {

                ctx._response.payload = value;
                return self.finish();
              }

              try {

                var action = self._actMeta.action.bind(self);

                // if request type is 'pubsub' we dont have to reply back
                if (requestType === 'pubsub') {

                  action(self._request.payload.pattern);

                  return self.finish();
                }

                // execute RPC action
                action(self._request.payload.pattern, function (err, resp) {

                  if (err) {

                    self._response.error = new _errors2.default.BusinessError(_constants2.default.IMPLEMENTATION_ERROR, {
                      pattern: self._pattern
                    }).causedBy(err);

                    return self.finish();
                  }

                  // assign action result
                  self._response.payload = resp;

                  self.finish();
                });
              } catch (err) {

                self._response.error = new _errors2.default.ImplementationError(_constants2.default.IMPLEMENTATION_ERROR, {
                  pattern: self._pattern
                }).causedBy(err);

                // service should exit
                self._shouldCrash = true;

                self.finish();
              }
            });
          } else {

            self.log.info({
              topic
            }, _constants2.default.PATTERN_NOT_FOUND);

            self._response.error = new _errors2.default.PatternNotFound(_constants2.default.PATTERN_NOT_FOUND, {
              pattern: self._pattern
            });

            // send error back to callee
            self.finish();
          }
        });
      };

      // standard pubsub with optional max proceed messages
      if (subToMany) {

        self.transport.subscribe(topic, {
          max: maxMessages
        }, handler);
      } else {

        // queue group names allow load balancing of services
        self.transport.subscribe(topic, {
          'queue': 'queue.' + topic,
          max: maxMessages
        }, handler);
      }

      this._topics[topic] = true;
    }

    /**
     * The topic is subscribed on NATS and can be called from any client.
     *
     * @param {any} pattern
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'add',
    value: function add(pattern, cb) {

      var hasCallback = _lodash2.default.isFunction(cb);

      // topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {

        var error = new _errors2.default.HemeraError(_constants2.default.NO_TOPIC_TO_SUBSCRIBE, {
          pattern
        });

        this.log.error(error);
        throw error;
      }

      if (!hasCallback) {

        var _error = new _errors2.default.HemeraError(_constants2.default.MISSING_IMPLEMENTATION, {
          pattern
        });

        this.log.error(_error);
        throw _error;
      }

      var origPattern = _lodash2.default.cloneDeep(pattern);

      var schema = {};

      // remove objects (rules) from pattern and extract schema
      _lodash2.default.each(pattern, function (v, k) {

        if (_lodash2.default.isObject(v)) {
          schema[k] = _lodash2.default.clone(v);
          delete origPattern[k];
        }
      });

      // remove special $ variables from pattern
      origPattern = _util2.default.cleanPattern(origPattern);

      // create message object which represent the object behind the matched pattern
      var actMeta = {
        schema: schema,
        pattern: origPattern,
        action: cb,
        plugin: this.plugin$
      };

      var handler = this._catalog.lookup(origPattern);

      // check if pattern is already registered
      if (handler) {

        var _error2 = new _errors2.default.HemeraError(_constants2.default.PATTERN_ALREADY_IN_USE, {
          pattern
        });

        this.log.error(_error2);
        throw _error2;
      }

      // add to bloomrun
      this._catalog.add(origPattern, actMeta);

      this.log.info(origPattern, _constants2.default.ADD_ADDED);

      // subscribe on topic
      this.subscribe(pattern.topic, pattern.pubsub$, pattern.maxMessages$);
    }

    /**
     * Start an action.
     *
     * @param {any} pattern
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'act',
    value: function act(pattern, cb) {

      // topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {

        var error = new _errors2.default.HemeraError(_constants2.default.NO_TOPIC_TO_REQUEST, {
          pattern
        });

        this.log.error(error);
        throw error;
      }

      // create new execution context
      var ctx = this.createContext();
      ctx._pattern = pattern;
      ctx._prevContext = this;
      ctx._cleanPattern = _util2.default.cleanPattern(pattern);
      ctx._response = new _clientResponse2.default(ctx);
      ctx._request = new _clientRequest2.default(ctx);

      ctx._extensions.onClientPreRequest.invoke(ctx, function onPreRequest(err) {

        var self = this;

        var hasCallback = _lodash2.default.isFunction(cb);

        var m = self._encoder.encode.call(self, self._message);

        // throw encoding issue
        if (m.error) {

          var _error3 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(m.error);

          self.log.error(_error3);

          if (hasCallback) {
            return cb.call(self, _error3);
          }

          return;
        }

        if (err) {

          var _error4 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

          self.log.error(_error4);

          if (hasCallback) {
            return cb.call(self, _error4);
          }

          return;
        }

        ctx._request.payload = m.value;
        ctx._request.error = m.error;

        // use simple publish mechanism instead to fire a request
        if (pattern.pubsub$ === true) {

          if (hasCallback) {
            self.log.info(_constants2.default.PUB_CALLBACK_REDUNDANT);
          }

          self.send(pattern.topic, self._request.payload);
        } else {

          // send request
          var sid = self.sendRequest(pattern.topic, self._request.payload, function (response) {

            var res = self._decoder.decode.call(ctx, response);
            self._response.payload = res.value;
            self._response.error = res.error;

            try {

              // if payload is invalid
              if (self._response.error) {

                var _error5 = new _errors2.default.ParseError(_constants2.default.PAYLOAD_PARSING_ERROR, {
                  pattern: self._cleanPattern
                }).causedBy(self._response.error);

                self.log.error(_error5);

                if (hasCallback) {
                  return cb.call(self, _error5);
                }
              }

              self._extensions.onClientPostRequest.invoke(ctx, function (err) {

                if (err) {

                  var _error6 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);

                  self.log.error(_error6);

                  if (hasCallback) {
                    return cb.call(self, _error6);
                  }

                  return;
                }

                if (hasCallback) {

                  if (self._response.payload.error) {

                    var responseError = _errio2.default.fromObject(self._response.payload.error);
                    var responseErrorCause = responseError.cause;
                    var _error7 = new _errors2.default.BusinessError(_constants2.default.BUSINESS_ERROR, {
                      pattern: self._cleanPattern
                    }).causedBy(responseErrorCause ? responseError.cause : responseError);

                    self.log.error(_error7);

                    return cb.call(self, responseError);
                  }

                  cb.apply(self, [null, self._response.payload.result]);
                }
              });
            } catch (err) {

              var _error8 = new _errors2.default.FatalError(_constants2.default.FATAL_ERROR, {
                pattern: self._cleanPattern
              }).causedBy(err);

              self.log.fatal(_error8);

              // let it crash
              if (self._config.crashOnFatal) {

                self.fatal();
              }
            }
          });

          // handle timeout
          self.handleTimeout(sid, pattern, cb);
        }
      });
    }

    /**
     * Handle the timeout when a pattern could not be resolved. Can have different reasons:
     * - No one was connected at the time (service unavailable)
     * - Service is actually still processing the request (service takes too long)
     * - Service was processing the request but crashed (service error)
     *
     * @param {any} sid
     * @param {any} pattern
     * @param {any} cb
     *
     * @memberOf Hemera
     */

  }, {
    key: 'handleTimeout',
    value: function handleTimeout(sid, pattern, cb) {
      var _this4 = this;

      // handle timeout
      this.timeout(sid, pattern.timeout$ || this._config.timeout, 1, function () {

        var hasCallback = _lodash2.default.isFunction(cb);

        var error = new _errors2.default.TimeoutError(_constants2.default.ACT_TIMEOUT_ERROR, {
          pattern
        });

        _this4.log.error(error);

        if (hasCallback) {

          try {

            cb.call(_this4, error);
          } catch (err) {

            var _error9 = new _errors2.default.FatalError(_constants2.default.FATAL_ERROR, {
              pattern
            }).causedBy(err);

            _this4.log.fatal(_error9);

            // let it crash
            if (_this4._config.crashOnFatal) {

              _this4.fatal();
            }
          }
        }
      });
    }

    /**
     * Create new instance of hemera but with pointer on the previous propertys
     * so we are able to create a scope per act without lossing the reference to the core api.
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'createContext',
    value: function createContext() {

      var self = this;

      var ctx = Object.create(self);

      return ctx;
    }

    /**
     * Return the list of all registered actions
     *
     * @memberOf Hemera
     */

  }, {
    key: 'list',
    value: function list(params) {

      return this._catalog.list(params);
    }

    /**
     * Close the process watcher and the underlying transort driver.
     *
     * @returns
     *
     * @memberOf Hemera
     */

  }, {
    key: 'close',
    value: function close() {

      this._heavy.stop();

      return this.transport.close();
    }
  }, {
    key: 'plugins',
    get: function get() {

      return this._plugins;
    }

    /**
     * Return the bloomrun instance
     *
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'catalog',
    get: function get() {

      return this._catalog;
    }

    /**
     * Return the heavy instance
     *
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'load',
    get: function get() {

      return this._heavy.load;
    }

    /**
     * Return the shared object of all exposed data
     *
     * @readonly
     * @type {Exposition}
     * @memberOf Hemera
     */

  }, {
    key: 'exposition',
    get: function get() {

      return this._exposition;
    }
  }, {
    key: 'transport',
    get: function get() {

      return this._transport;
    }

    /**
     * Return all registered topics
     *
     * @readonly
     *
     * @memberOf Hemera
     */

  }, {
    key: 'topics',
    get: function get() {
      return this._topics;
    }
  }]);

  return Hemera;
}(_events2.default);

module.exports = Hemera;
//# sourceMappingURL=index.js.map