'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const Errors = require('./errors')
const Constants = require('./constants')
const Errio = require('errio')

/**
 *
 * @class Reply
 */
class MessageBuilder {
    constructor(hemera, reply, encoder) {
        this._hemera = hemera
        this._reply = reply
        this._encoder = encoder
    }
    build(meta$, trace$, request$) {
        const self = this

        let message = {
            meta: meta$ || {},
            trace: trace$ || {},
            request: request$,
            result: this._reply.error ? null : this._reply.payload,
            error: this._reply.error ? Errio.toObject(this._reply.error) : null
        }

        let msg = this._encoder.run(message, self)

        if (msg.error) {
            let internalError = new Errors.ParseError(
                Constants.PAYLOAD_PARSING_ERROR
            ).causedBy(msg.error)
            message.error = Errio.toObject(internalError)
            message.result = null
            msg = this._encoder.run(message, self)
        }

        return msg
    }
}

module.exports = MessageBuilder
