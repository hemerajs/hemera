// @flow

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 */

// Errors messages
module.exports = {
  JSON_PARSE_ERROR: 'Invalid JSON payload',
  ACT_TIMEOUT_ERROR: 'Timeout',
  NO_TOPIC_TO_SUBSCRIBE: 'No topic to subscribe',
  NO_TOPIC_TO_REQUEST: 'No topic to request',
  PATTERN_ALREADY_IN_USE: 'Pattern is already in use',
  MISSING_IMPLEMENTATION: 'Missing implementation',
  INVALID_ERROR_OBJECT: 'No native Error object passed',
  PATTERN_NOT_FOUND: 'No handler found for this pattern',
  IMPLEMENTATION_ERROR: 'Bad implementation',
  PAYLOAD_PARSING_ERROR: 'Invalid payload',
  PLUGIN_ALREADY_IN_USE: 'Plugin is already registered',
  TRANSPORT_CONNECTED: 'Connected!',
  PLUGIN_ADDED: 'PLUGIN - ADDED!',
  PAYLOAD_VALIDATION_ERROR: 'Invalid payload',
  ADD_ADDED: 'ADD - ADDED',
  BUSINESS_ERROR: 'Business error',
  FATAL_ERROR: 'Fatal error',
  EXTENSION_ERROR: 'Extension error',
  PUB_CALLBACK_REDUNDANT: 'Specify a callback as publisher is redundant',
  INVALID_EXTENSION_TYPE: 'Invalid extension type'
}
