'use strict'

var Hemera = require('../'),
  nsc = require('./../test/support/nats_server_control'),
  Code = require('code'),
  bench = require('fastbench');

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

      cb(null, {
        result: resp.a + resp.b
      });
    });

  });

  var run = bench([
    function act(done) {

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        done();
      });

    }
  ], {
    iterations: 1000
  });

  run(function () {
    hemera.close();
    server.kill();
  })

});