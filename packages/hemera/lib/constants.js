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
  // General
  NATS_QUEUEGROUP_PREFIX: 'queue',
  // NATS conn error codes
  NATS_CONN_ERROR_CODES: ['CONN_ERR', 'SECURE_CONN_REQ_MSG', 'NON_SECURE_CONN_REQ_MSG', 'CLIENT_CERT_REQ_MSG'],
  // NATS erros
  NATS_TRANSPORT_ERROR: 'Could not connect to NATS!',
  NATS_TRANSPORT_CLOSED: 'NATS connection closed!',
  NATS_TRANSPORT_CONNECTED: 'Connected!',
  NATS_PERMISSION_ERROR: 'NATS permission error',
  NATS_TRANSPORT_RECONNECTING: 'NATS reconnecting ...',
  NATS_TRANSPORT_RECONNECTED: 'NATS reconnected!',
  NATS_TRANSPORT_DISCONNECTED: 'NATS disconnected!',
  // Hemera request types
  REQUEST_TYPE_PUBSUB: 'pubsub',
  REQUEST_TYPE_REQUEST: 'request',
  // Application errors
  JSON_PARSE_ERROR: 'Invalid JSON payload',
  TOPIC_SID_REQUIRED_FOR_DELETION: 'Topic or sid is required for deletion',
  ACT_TIMEOUT_ERROR: 'Timeout',
  NO_TOPIC_TO_SUBSCRIBE: 'No topic to subscribe',
  NO_TOPIC_TO_REQUEST: 'No topic to request',
  PATTERN_ALREADY_IN_USE: 'Pattern is already in use',
  INVALID_ERROR_OBJECT: 'No native Error object passed',
  PATTERN_NOT_FOUND: 'No handler found for this pattern',
  IMPLEMENTATION_ERROR: 'Bad implementation',
  PAYLOAD_PARSING_ERROR: 'Invalid payload',
  ADD_MIDDLEWARE_ERROR: 'Middleware error',
  PLUGIN_ALREADY_REGISTERED: 'Plugin was already registered',
  PLUGIN_ADDED: 'PLUGIN - ADDED!',
  PAYLOAD_VALIDATION_ERROR: 'Invalid payload',
  ADD_ADDED: 'ADD - ADDED',
  BUSINESS_ERROR: 'Business error',
  FATAL_ERROR: 'Fatal error',
  EXTENSION_ERROR: 'Extension error',
  PUB_CALLBACK_REDUNDANT: 'Specify a callback as publisher is redundant',
  INVALID_EXTENSION_TYPE: 'Invalid extension type',
  PLUGIN_NAME_REQUIRED: 'Plugin name is required',
  PLUGIN_REGISTRATION_ERROR: 'Error during plugin registration',
  DECORATION_ALREADY_DEFINED: 'Server decoration already defined',
  OVERRIDE_BUILTIN_METHOD_NOT_ALLOWED: 'Cannot override the built-in server interface method',
  GRACEFULLY_SHUTDOWN: 'Gracefully shutdown',
  PLUGIN_TIMEOUT_ERROR: 'Plugin callback was not called',
  ACT_PATTERN_REQUIRED: 'Pattern is required to start an act call',
  ADD_PATTERN_REQUIRED: 'Pattern is required to define an add',
  NO_USE_IN_PLUGINS: 'Call `use()` inside plugins not allowed'
}
