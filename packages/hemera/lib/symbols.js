'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

module.exports = {
  sChildren: Symbol('hemera.children'),
  sRegisteredPlugins: Symbol('hemera.registered-plugin'),
  sReplySent: Symbol('hemera.reply-sent'),
  sReplyRequest: Symbol('hemera.reply-request'),
  sReplyResponse: Symbol('hemera.reply-response'),
  sReplyHemera: Symbol('hemera.reply-hemera'),
  sReplyLog: Symbol('hemera.reply-log'),
  sAddReceivedMsg: Symbol('hemera.add-receivedMsg')
}
