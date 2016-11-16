'use strict';

var Hemera = require('../'),
  nsc = require('./support/nats_server_control'),
  Code = require('code');

const expect = Code.expect;

describe('Basic', function () {

  var PORT = 6242;
  var flags = ['--user', 'derek', '--pass', 'foobar'];
  var authUrl = 'nats://derek:foobar@localhost:' + PORT;
  var noAuthUrl = 'nats://localhost:' + PORT;
  var server;

  // Start up our own nats-server
  before(function (done) {
    server = nsc.start_server(PORT, flags, done);
  });

  // Shutdown our server after we are done
  after(function () {
    server.kill();
  });

  it('Should be able to add a handler and act it', function (done) {

    const nats = require('nats').connect(authUrl);
    const hemera = new Hemera({
      nats
    });

    hemera.add({
      topic: 'math',
      cmd: 'add'
    }, (resp, cb) => {

      cb({ result: resp.a + resp.b });
    });

    hemera.act({
      topic: 'math',
      cmd: 'add',
      a: 1,
      b: 2
    }, (resp) => {

      expect(resp.result).to.be.equals(3);

      done();
    });

  });

});