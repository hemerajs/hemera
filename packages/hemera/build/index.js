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

var _signalExit = require('signal-exit');

var _signalExit2 = _interopRequireDefault(_signalExit);

var _tinysonic = require('tinysonic');

var _tinysonic2 = _interopRequireDefault(_tinysonic);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

var _extension = require('./extension');

var _extension2 = _interopRequireDefault(_extension);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _transport = require('./transport');

var _transport2 = _interopRequireDefault(_transport);

var _extensions = require('./extensions');

var DefaultExtensions = _interopRequireWildcard(_extensions);

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

var _serializer = require('./serializer');

var _serializer2 = _interopRequireDefault(_serializer);

var _add = require('./add');

var _add2 = _interopRequireDefault(_add);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*!
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
    _this._router = (0, _bloomrun2.default)();
    _this._heavy = new _heavy2.default(_this._config.load);
    _this._transport = new _transport2.default({
      transport
    });
    _this._topics = {};
    _this._exposition = {};

    // special variables for the new execution context
    _this.context$ = {};
    _this.meta$ = {};
    _this.delegate$ = {};
    _this.auth$ = {};
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

    // client and server locales
    _this._shouldCrash = false;
    _this._topic = '';
    _this._replyTo = '';
    _this._request = null;
    _this._response = null;
    _this._pattern = null;
    _this._actMeta = null;
    _this._actCallback = null;
    _this._cleanPattern = '';

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
    _this._extensions.onClientPreRequest.addRange(DefaultExtensions.onClientPreRequest);
    // will be executed after the client received and decoded the request
    _this._extensions.onClientPostRequest.addRange(DefaultExtensions.onClientPostRequest);
    // will be executed before the server received the requests
    _this._extensions.onServerPreRequest.addRange(DefaultExtensions.onServerPreRequest);
    // will be executed before the server action is executed
    _this._extensions.onServerPreHandler.addRange(DefaultExtensions.onServerPreHandler);
    // will be executed before the server reply the response and build the message
    _this._extensions.onServerPreResponse.addRange(DefaultExtensions.onServerPreResponse);

    // use own logger
    if (_this._config.logger) {
      _this.log = _this._config.logger;
    } else {
      var pretty = _pino2.default.pretty();

      // Leads to too much listeners in tests
      if (_this._config.logLevel !== 'silent') {
        pretty.pipe(process.stdout);
      }

      _this.log = (0, _pino2.default)({
        name: _this._config.name,
        safe: true, // avoid error caused by circular references
        level: _this._config.logLevel,
        serializers: _serializer2.default
      }, pretty);
    }

    // no matter how a process exits log and fire event
    (0, _signalExit2.default)(function (code, signal) {
      _this.log.fatal({
        code,
        signal
      }, 'process exited');
      _this.emit('teardown', {
        code,
        signal
      });
      _this.close();
    });
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
     * Add an extension. Extensions are called in serie
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
        this.log.warn(_constants2.default.PLUGIN_ALREADY_IN_USE, params.attributes.name, this._plugins[params.attributes.name].parentPlugin);
        return;
      }

      // create new execution context
      var ctx = this.createContext();
      ctx.plugin$ = {};
      ctx.plugin$.attributes = params.attributes || {};
      ctx.plugin$.attributes.dependencies = params.attributes.dependencies || [];
      ctx.plugin$.parentPlugin = this.plugin$.attributes.name;
      ctx.plugin$.options = params.options || {};
      ctx.plugin$.options.payloadValidator = params.options.payloadValidator || '';

      params.plugin.call(ctx, params.options);

      this.log.info(params.attributes.name, _constants2.default.PLUGIN_ADDED);
      this._plugins[params.attributes.name] = ctx.plugin$;
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

      this._transport.driver.on('connect', function () {
        _this2.log.info(_constants2.default.TRANSPORT_CONNECTED);

        if (_lodash2.default.isFunction(cb)) {
          cb.call(_this2);
        }
      });
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
      function onServerPreResponseHandler(err, value) {
        var self = this;

        // check if an error was already catched
        if (self._response.error) {
          self.emit('serverResponseError', self._response.error);
          self.log.error(self._response.error);
        } else if (err) {
          // check for an extension error
          var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
          self.emit('serverResponseError', error);
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
            return self._transport.send(self._replyTo, self._message, function () {
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
          return this._transport.send(this._replyTo, self._message);
        }
      }

      this._extensions.onServerPreResponse.invoke(this, onServerPreResponseHandler);
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

      /**
       *
       *
       * @param {any} err
       * @param {any} resp
       * @returns
       */
      function actionHandler(err, resp) {
        var self = this;

        if (err) {
          self._response.error = new _errors2.default.BusinessError(_constants2.default.IMPLEMENTATION_ERROR, {
            pattern: self._pattern
          }).causedBy(err);

          return self.finish();
        }

        // assign action result
        self._response.payload = resp;
        // delete error we have payload
        self._response.error = null;

        self.finish();
      }

      /**
       *
       *
       * @param {any} err
       * @param {any} value
       * @returns
       */
      function onServerPreHandler(err, value) {
        var self = this;

        if (err) {
          self._response.error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
          self.log.error(self._response.error);

          return self.finish();
        }

        // reply value from extension
        if (value) {
          self._response.payload = value;
          return self.finish();
        }

        try {
          var action = self._actMeta.action.bind(self);

          // execute add middlewares
          _util2.default.serial(self._actMeta.middleware, function (item, next) {
            item(self._request, self._response, next);
          }, function (err) {
            // middleware error
            if (err) {
              var error = new _errors2.default.HemeraError(_constants2.default.ADD_MIDDLEWARE_ERROR).causedBy(err);
              self.log.error(error);
              self._response.error = error;
              return self.finish();
            }

            // if request type is 'pubsub' we dont have to reply back
            if (self._request.payload.request.type === 'pubsub') {
              action(self._request.payload.pattern);
              return self.finish();
            }

            // execute RPC action
            action(self._request.payload.pattern, actionHandler.bind(self));
          });
        } catch (err) {
          self._response.error = new _errors2.default.ImplementationError(_constants2.default.IMPLEMENTATION_ERROR, {
            pattern: self._pattern
          }).causedBy(err);

          // service should exit
          self._shouldCrash = true;

          self.finish();
        }
      }

      /**
       *
       *
       * @param {any} err
       * @param {any} value
       * @returns
       */
      function onServerPreRequestHandler(err, value) {
        var self = this;

        if (err) {
          var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
          self.log.error(error);
          self._response.error = error;

          return self.finish();
        }

        // reply value from extension
        if (value) {
          self._response.payload = value;
          return self.finish();
        }

        // find matched route
        self._pattern = self._request.payload.pattern;
        self._actMeta = self._router.lookup(self._pattern);

        // check if a handler is registered with this pattern
        if (self._actMeta) {
          self._extensions.onServerPreHandler.invoke(self, onServerPreHandler);
        } else {
          self.log.info({
            topic: self._topic
          }, _constants2.default.PATTERN_NOT_FOUND);

          self._response.error = new _errors2.default.PatternNotFound(_constants2.default.PATTERN_NOT_FOUND, {
            pattern: self._pattern
          });

          // send error back to callee
          self.finish();
        }
      }

      var handler = function handler(request, replyTo) {
        // create new execution context
        var ctx = _this3.createContext();
        ctx._shouldCrash = false;
        ctx._replyTo = replyTo;
        ctx._topic = topic;
        ctx._request = new _serverRequest2.default(request);
        ctx._response = new _serverResponse2.default();
        ctx._pattern = {};
        ctx._actMeta = {};

        ctx._extensions.onServerPreRequest.invoke(ctx, onServerPreRequestHandler);
      };

      // standard pubsub with optional max proceed messages
      if (subToMany) {
        self._transport.subscribe(topic, {
          max: maxMessages
        }, handler);
      } else {
        // queue group names allow load balancing of services
        self._transport.subscribe(topic, {
          'queue': 'queue.' + topic,
          max: maxMessages
        }, handler);
      }

      self._topics[topic] = true;
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
      // check for use quick syntax for JSON objects
      if (_lodash2.default.isString(pattern)) {
        pattern = (0, _tinysonic2.default)(pattern);
      }

      // topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {
        var error = new _errors2.default.HemeraError(_constants2.default.NO_TOPIC_TO_SUBSCRIBE, {
          pattern
        });

        this.log.error(error);
        throw error;
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
      var actMeta = new _add2.default({
        schema: schema,
        pattern: origPattern,
        action: cb,
        plugin: this.plugin$
      });

      var handler = this._router.lookup(origPattern);

      // check if pattern is already registered
      if (handler) {
        var _error = new _errors2.default.HemeraError(_constants2.default.PATTERN_ALREADY_IN_USE, {
          pattern
        });

        this.log.error(_error);
        throw _error;
      }

      // add to bloomrun
      this._router.add(origPattern, actMeta);

      this.log.info(origPattern, _constants2.default.ADD_ADDED);

      // subscribe on topic
      this.subscribe(pattern.topic, pattern.pubsub$, pattern.maxMessages$);

      return actMeta;
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
      // check for use quick syntax for JSON objects
      if (_lodash2.default.isString(pattern)) {
        pattern = (0, _tinysonic2.default)(pattern);
      }

      // topic is needed to subscribe on a subject in NATS
      if (!pattern.topic) {
        var error = new _errors2.default.HemeraError(_constants2.default.NO_TOPIC_TO_REQUEST, {
          pattern
        });

        this.log.error(error);
        throw error;
      }

      /**
       *
       *
       * @param {any} err
       * @returns
       */
      function onClientPostRequestHandler(err) {
        var self = this;
        if (err) {
          var _error2 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
          self.emit('clientResponseError', _error2);
          self.log.error(_error2);

          if (self._actCallback) {
            return self._actCallback(_error2);
          }

          return;
        }

        if (self._actCallback) {
          if (self._response.payload.error) {
            var responseError = _errio2.default.fromObject(self._response.payload.error);
            var responseErrorCause = responseError.cause;
            var _error3 = new _errors2.default.BusinessError(_constants2.default.BUSINESS_ERROR, {
              pattern: self._cleanPattern
            }).causedBy(responseErrorCause ? responseError.cause : responseError);
            self.emit('clientResponseError', _error3);
            self.log.error(_error3);

            return self._actCallback(responseError);
          }

          self._actCallback(null, self._response.payload.result);
        }
      }

      /**
       *
       *
       * @param {any} response
       * @returns
       */
      function sendRequestHandler(response) {
        var self = this;
        var res = self._decoder.decode.call(self, response);
        self._response.payload = res.value;
        self._response.error = res.error;

        try {
          // if payload is invalid
          if (self._response.error) {
            var _error4 = new _errors2.default.ParseError(_constants2.default.PAYLOAD_PARSING_ERROR, {
              pattern: self._cleanPattern
            }).causedBy(self._response.error);
            self.emit('clientResponseError', _error4);
            self.log.error(_error4);

            if (self._actCallback) {
              return self._actCallback(_error4);
            }
          }

          self._extensions.onClientPostRequest.invoke(self, onClientPostRequestHandler);
        } catch (err) {
          var _error5 = new _errors2.default.FatalError(_constants2.default.FATAL_ERROR, {
            pattern: self._cleanPattern
          }).causedBy(err);
          self.emit('clientResponseError', _error5);
          self.log.fatal(_error5);

          // let it crash
          if (self._config.crashOnFatal) {
            self.fatal();
          }
        }
      }

      /**
       *
       *
       * @param {any} err
       * @returns
       */
      function onPreRequestHandler(err) {
        var self = this;

        var m = self._encoder.encode.call(self, self._message);

        // throw encoding issue
        if (m.error) {
          var _error6 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(m.error);
          self.emit('clientResponseError', _error6);
          self.log.error(_error6);

          if (self._actCallback) {
            return self._actCallback(_error6);
          }

          return;
        }

        if (err) {
          var _error7 = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
          self.emit('clientResponseError', _error7);
          self.log.error(_error7);

          if (self._actCallback) {
            return self._actCallback(_error7);
          }

          return;
        }

        self._request.payload = m.value;
        self._request.error = m.error;

        // use simple publish mechanism instead of request/reply
        if (pattern.pubsub$ === true) {
          if (self._actCallback) {
            self.log.info(_constants2.default.PUB_CALLBACK_REDUNDANT);
          }

          self._transport.send(pattern.topic, self._request.payload);
        } else {
          // send request
          var sid = self._transport.sendRequest(pattern.topic, self._request.payload, sendRequestHandler.bind(self));

          // handle timeout
          self.handleTimeout(sid, pattern);
        }
      }

      // create new execution context
      var ctx = this.createContext();
      ctx._pattern = pattern;
      ctx._prevContext = this;
      ctx._actCallback = _lodash2.default.isFunction(cb) ? cb.bind(ctx) : null;
      ctx._cleanPattern = _util2.default.cleanPattern(pattern);
      ctx._response = new _clientResponse2.default();
      ctx._request = new _clientRequest2.default();

      ctx._extensions.onClientPreRequest.invoke(ctx, onPreRequestHandler);
    }

    /**
     * Handle the timeout when a pattern could not be resolved. Can have different reasons:
     * - No one was connected at the time (service unavailable)
     * - Service is actually still processing the request (service takes too long)
     * - Service was processing the request but crashed (service error)
     *
     * @param {any} sid
     * @param {any} pattern
     *
     * @memberOf Hemera
     */

  }, {
    key: 'handleTimeout',
    value: function handleTimeout(sid, pattern) {
      var _this4 = this;

      var timeout = pattern.timeout$ || this._config.timeout;

      function onClientPostRequestHandler(err) {
        var self = this;
        if (err) {
          var error = new _errors2.default.HemeraError(_constants2.default.EXTENSION_ERROR).causedBy(err);
          self.emit('clientResponseError', error);
          self._response.error = error;
          self.log.error(self._response.error);
        }

        if (self._actCallback) {
          try {
            self._actCallback(self._response.error);
          } catch (err) {
            var _error8 = new _errors2.default.FatalError(_constants2.default.FATAL_ERROR, {
              pattern
            }).causedBy(err);
            self.emit('clientResponseError', _error8);
            self.log.fatal(_error8);

            // let it crash
            if (self._config.crashOnFatal) {
              self.fatal();
            }
          }
        }
      }

      var timeoutHandler = function timeoutHandler() {
        var error = new _errors2.default.TimeoutError(_constants2.default.ACT_TIMEOUT_ERROR, {
          pattern
        });
        _this4.emit('clientResponseError', error);
        _this4.log.error(error);
        _this4._response.error = error;
        _this4._extensions.onClientPostRequest.invoke(_this4, onClientPostRequestHandler);
      };

      this._transport.timeout(sid, timeout, 1, timeoutHandler);
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
      return this._router.list(params);
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

      return this._transport.close();
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
    key: 'router',
    get: function get() {
      return this._router;
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
      return this._transport.driver;
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