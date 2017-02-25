'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onServerPreResponse = exports.onServerPreHandler = exports.onServerPreRequest = exports.onClientPostRequest = exports.onClientPreRequest = undefined;

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var onClientPreRequest = exports.onClientPreRequest = [function onClientPreRequest(next) {
  var ctx = this;

  var pattern = this._pattern;

  var prevCtx = this._prevContext;
  var cleanPattern = this._cleanPattern;
  var currentTime = _util2.default.nowHrTime();

  // shared context
  ctx.context$ = pattern.context$ || prevCtx.context$;

  // set metadata by passed pattern or current message context
  ctx.meta$ = Object.assign(pattern.meta$ || {}, ctx.meta$);
  // is only passed by msg
  ctx.delegate$ = pattern.delegate$ || {};

  // tracing
  ctx.trace$ = pattern.trace$ || {};
  ctx.trace$.parentSpanId = prevCtx.trace$.spanId;
  ctx.trace$.traceId = prevCtx.trace$.traceId || _util2.default.randomId();
  ctx.trace$.spanId = pattern.trace$ ? pattern.trace$.spanId : _util2.default.randomId();
  ctx.trace$.timestamp = currentTime;
  ctx.trace$.service = pattern.topic;
  ctx.trace$.method = _util2.default.pattern(pattern);

  // request
  var request = {
    id: pattern.requestId$ || _util2.default.randomId(),
    parentId: ctx.request$.id,
    timestamp: currentTime,
    type: pattern.pubsub$ === true ? 'pubsub' : 'request',
    duration: 0
  };

  // build msg
  var message = {
    pattern: cleanPattern,
    meta: ctx.meta$,
    delegate: ctx.delegate$,
    trace: ctx.trace$,
    request: request
  };

  ctx._message = message;

  ctx.log.info({
    outbound: ctx
  });

  ctx.emit('onClientPreRequest');

  next();
}]; /*!
     * hemera
     * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
     * MIT Licensed
     */

var onClientPostRequest = exports.onClientPostRequest = [function onClientPostRequest(next) {
  var ctx = this;
  var pattern = this._pattern;
  var msg = ctx._response.payload;

  // pass to act context
  if (msg) {
    ctx.request$ = msg.request || {};
    ctx.trace$ = msg.trace || {};
    ctx.meta$ = msg.meta || {};
  }

  ctx.request$.service = pattern.topic;
  ctx.request$.method = _util2.default.pattern(pattern);

  ctx.log.info({
    inbound: ctx
  });

  ctx.emit('onClientPostRequest');

  next();
}];

var onServerPreRequest = exports.onServerPreRequest = [function onServerPreRequest(req, res, next) {
  var ctx = this;

  var m = ctx._decoder.decode.call(ctx, ctx._request.payload);

  if (m.error) {
    return res.send(m.error);
  }

  var msg = m.value;

  if (msg) {
    ctx.meta$ = msg.meta || {};
    ctx.trace$ = msg.trace || {};
    ctx.delegate$ = msg.delegate || {};
    ctx.request$ = msg.request || {};
  }

  ctx._request.payload = m.value;
  ctx._request.error = m.error;

  ctx.emit('onServerPreRequest');

  next();
}];

var onServerPreHandler = exports.onServerPreHandler = [function onServerPreHandler(req, res, next) {
  var ctx = this;

  ctx.emit('onServerPreHandler');

  next();
}];

var onServerPreResponse = exports.onServerPreResponse = [function onServerPreResponse(req, res, next) {
  var ctx = this;

  ctx.emit('onServerPreResponse');

  next();
}];
//# sourceMappingURL=extensions.js.map