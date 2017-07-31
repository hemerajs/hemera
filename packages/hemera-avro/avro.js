'use strict'

let schema = {
  name: 'Packet',
  type: 'record',
  fields: [{
    name: 'trace',
    type: {
      name: 'Trace',
      type: 'record',
      fields: [{
        name: 'traceId',
        type: 'string',
        default: ''
      },
      {
        name: 'parentSpanId',
        type: 'string',
        default: ''
      },
      {
        name: 'spanId',
        type: 'string',
        default: ''
      },
      {
        name: 'timestamp',
        type: 'long',
        default: 0
      },
      {
        name: 'service',
        type: 'string',
        default: ''
      },
      {
        name: 'method',
        type: 'string',
        default: ''
      },
      {
        name: 'duration',
        type: 'long',
        default: 0
      }
      ]
    }
  }, {
    name: 'request',
    type: {
      name: 'Request',
      type: 'record',
      fields: [{
        name: 'id',
        type: 'string',
        default: ''
      },
      {
        name: 'type',
        type: {
          name: 'Type',
          type: 'enum',
          symbols: ['request', 'pubsub']
        },
        default: 'request'
      }
      ]
    }
  }, {
    name: 'result',
    type: ['null', 'string', 'boolean', 'double', 'bytes'],
    default: null
  },
  {
    name: 'error',
    default: {},
    type: [{
      name: 'Error',
      type: 'record',
      fields: [{
        name: 'name',
        type: 'string',
        default: ''
      },
      {
        name: 'statusCode',
        type: 'int',
        default: 0
      },
      {
        name: 'code',
        type: 'int',
        default: 0
      },
      {
        name: 'message',
        type: 'string',
        default: ''
      },
      {
        name: 'stack',
        type: 'string',
        default: ''
      },
      {
        name: 'hops',
        type: {
          type: 'array',
          items: {
            type: 'record',
            fields: [
              { name: 'service', type: 'string' },
              { name: 'method', type: 'string' },
              { name: 'app', type: 'string' },
              { name: 'ts', type: 'long' }
            ]
          }
        },
        default: []
      },
      {
        name: 'details',
        type: {
          type: 'map',
          values: ['string', 'boolean', 'double']
        },
        default: {}
      }]
    }, 'null']
  }, {
    name: 'meta',
    default: {},
    type: [{
      type: 'map',
      values: ['string', 'boolean', 'double']
    }]
  },
  {
    name: 'pattern',
    default: {},
    type: [{
      type: 'map',
      values: ['null', 'string', 'boolean', 'double']
    }, {
      type: 'bytes'
    }]
  },
  {
    name: 'delegate',
    default: {},
    type: [{
      type: 'map',
      values: ['string', 'boolean', 'double']
    }]
  }
  ]
}

module.exports = schema
