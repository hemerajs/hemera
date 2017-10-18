'use strict'

const Hemera = require('./../../packages/hemera')
const nats = require('nats').connect()
const hemeraMongo = require('./../../packages/hemera-mongo-store')

const hemera = new Hemera(nats, {
    logLevel: 'info',
    childLogger: true
})

hemera.use(hemeraMongo, {
    useDbAsTopicSuffix: true,
    mongo: {
        url: 'mongodb://localhost:27017/testDb'
    }
})


hemera.ready(() => {

    hemera.act({
        topic: 'mongo-store.testDb',
        cmd: 'create',
        collection: 'collTest',
        data: {
            name: 'peter'
        }
    }, function (err, resp) {
        this.log.info(resp, 'Query result')
    });

})
