'use strict'

var Hemera = require('../'),
  nsc = require('./../test/support/nats_server_control'),
  Code = require('code'),
  Async = require("async");

var PORT = 6242;
var flags = ['--user', 'derek', '--pass', 'foobar'];
var authUrl = 'nats://derek:foobar@localhost:' + PORT;
var noAuthUrl = 'nats://localhost:' + PORT;
var server = nsc.start_server(PORT, flags, () => {

  const nats = require('nats').connect(authUrl);
  const hemera = new Hemera(nats);

  hemera.ready(() => {

    hemera.add({
      topic: 'math',
      cmd: 'add'
    }, (resp, cb) => {

      setTimeout(() => {
        
        cb(null, {
          result: resp.a + resp.b
        });
        
      }, 1000)

    });

    function act(cb) {
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        cb(err, resp);
      });
    }

    let t1 = new Date();

    Async.parallel([
        function (callback) {
          act(callback)
        },
        function (callback) {
          act(callback)
        },
        function (callback) {
          act(callback)
        },
        function (callback) {
          act(callback)
        }
      ],
      // optional callback
      function (err, results) {
        console.log('Result', results, ((new Date) - t1) + 'ms');
        hemera.close();
        server.kill();
      });

  });


});