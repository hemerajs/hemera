'use strict';

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _hoek = require('hoek');

var _hoek2 = _interopRequireDefault(_hoek);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

module.exports.onClientPreRequest = [function onClientPreRequest(next) {

  var ctx = this;

  var pattern = this._pattern;

  var prevCtx = this._prevContext;
  var cleanPattern = this._cleanPattern;
  var currentTime = _util2.default.nowHrTime();

  // shared context
  ctx.context$ = pattern.context$ || prevCtx.context$;

  // set metadata by passed pattern or current message context
  ctx.meta$ = _hoek2.default.merge(pattern.meta$ || {}, ctx.meta$);
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

  ctx.log.info(pattern, `ACT_OUTBOUND - ID:${String(ctx._message.request.id)}`);

  ctx.emit('onClientPreRequest', ctx);

  next();
}];

module.exports.onClientPostRequest = [function onClientPostRequest(next) {

  var ctx = this;
  var pattern = this._pattern;
  var msg = ctx._response.value;

  // pass to act context
  ctx.request$ = msg.request || {};
  ctx.request$.service = pattern.topic;
  ctx.request$.method = _util2.default.pattern(pattern);
  ctx.trace$ = msg.trace || {};
  ctx.meta$ = msg.meta || {};

  ctx.log.info(`ACT_INBOUND - ID:${ctx.request$.id} (${ctx.request$.duration / 1000000}ms)`);

  ctx.emit('onClientPostRequest', ctx);

  next();
}];

module.exports.onServerPreRequest = [function onServerPreRequest(next) {

  var ctx = this;

  var m = ctx._decoder.decode.call(ctx, ctx._request);

  if (m.error) {

    return next(m.error);
  }

  var msg = m.value;

  if (msg) {

    ctx.meta$ = msg.meta || {};
    ctx.trace$ = msg.trace || {};
    ctx.delegate$ = msg.delegate || {};
    ctx.request$ = msg.request || {};
  }

  ctx._request = m;

  ctx.emit('onServerPreRequest', ctx);

  next();
}];

module.exports.onServerPreHandler = [function onServerPreHandler(next, i) {

  var ctx = this;

  ctx.emit('onServerPreHandler', ctx);

  next();
}];

module.exports.onServerPreResponse = [function onServerPreResponse(next) {

  var ctx = this;

  ctx.emit('onServerPreResponse', ctx);

  next();
}];
//# sourceMappingURL=extensions.js.map