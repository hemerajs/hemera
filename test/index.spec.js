'use strict';

const Hemera = require('../'),
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
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {

        cb(null, {
          result: resp.a + resp.b
        });
      });

      hemera.add({
        topic: 'math',
        cmd: 'multiply'
      }, (resp, cb) => {

        cb(null, {
          result: resp.a * resp.b
        });
      });

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).not.to.be.exists();
        expect(resp.result).to.be.equals(3);

        hemera.act({
          topic: 'math',
          cmd: 'multiply',
          a: resp.result,
          b: 2
        }, (err, resp) => {

          expect(err).not.to.be.exists();
          expect(resp.result).to.be.equals(6);

          hemera.close();
          done();
        });
      });

    });

  });

  it('Should be able to act without a callback', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 2000
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

        cb();

      });

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      });

      hemera.close();
      done();

    });

  });

  it('Should be able to get list of all patterns', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 2000
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'send'
      }, (resp, cb) => {

      });

      let result = hemera.list();

      expect(result).to.be.an.array();

      hemera.close();
      done();

    });

  });

  it('Callback must be from type function', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      try {

        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, 'no function');

      } catch (err) {

        expect(err.name).to.be.equals('HemeraError');
        expect(err.message).to.be.equals('Missing implementation');
        hemera.close();
        done();

      }

    });

  });

  it('Topic is required in a add', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      try {

        hemera.add({
          cmd: 'send'
        }, (resp, cb) => {
          cb();

        });

      } catch (err) {

        expect(err.name).to.be.equals('HemeraError');
        expect(err.message).to.be.equals('No topic to subscribe');
        hemera.close();
        done();

      }

    });

  });

  it('Should throw an error by duplicate patterns', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      try {

        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, (resp, cb) => {
          cb();

        });

        hemera.add({
          topic: 'math',
          cmd: 'send'
        }, (resp, cb) => {
          cb();

        });

      } catch (err) {

        expect(err.name).to.be.equals('HemeraError');
        expect(err.message).to.be.equals('Pattern is already in use');
        hemera.close();
        done();

      }

    });

  });

  it('Topic is required in a act', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      try {

        hemera.act({
          cmd: 'send'
        }, (resp, cb) => {


        });

      } catch (err) {

        expect(err.name).to.be.equals('HemeraError');
        expect(err.message).to.be.equals('No topic to request');
        hemera.close();
        done();

      }

    });

  });

  it('Should be able to call a handler by different patterns', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (resp, cb) => {

        cb(null, {
          result: resp.a + resp.b
        });
      });

      hemera.add({
        topic: 'math',
        cmd: 'sub'
      }, (resp, cb) => {

        cb(null, {
          result: resp.a - resp.b
        });
      });

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).not.to.be.exists();
        expect(resp.result).to.be.equals(3);

        hemera.act({
          topic: 'math',
          cmd: 'sub',
          a: 2,
          b: 2
        }, (err, resp) => {

          expect(err).not.to.be.exists();
          expect(resp.result).to.be.equals(0);
          hemera.close();
          done();
        });
      });

    });

  });

});


describe('Timeouts', function () {

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

  it('Should be able to check for an error when we get no answer back within the timeout limit', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).to.be.exists();
        expect(resp).not.to.be.exists();
        expect(err.name).to.be.equals('TimeoutError');
        expect(err.message).to.be.equals('Timeout');
        hemera.close();
        done();
      });

    });

  });

});


describe('Logging', function () {

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

  it('Should be able to check for an error when we get no answer back within the timeout limit', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.log.info('Test');
    hemera.log.fatal('Test');

    hemera.close();
    done();

  });

});


describe('Error handling', function () {

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

  it('Should be able to serialize and deserialize an error back to the callee', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

        cb(new Error('Uups'));
      });

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {

        expect(err).to.be.exists();
        expect(err.name).to.be.equals('BusinessError');
        expect(err.message).to.be.equals('Bad implementation');
        expect(err.cause.name).to.be.equals('Error');
        expect(err.cause.message).to.be.equals('Uups');
        expect(err.ownStack).to.be.exists();
        hemera.close();
        done();


      });

    });

  });

  it('Should be able to handle business errors', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      crashOnFatal: false
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

        throw new Error('Shit!');
      });

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {

        expect(err).to.be.exists();
        expect(err.name).to.be.equals('ImplementationError');
        expect(err.message).to.be.equals('Bad implementation');
        expect(err.cause.name).to.be.equals('Error');
        expect(err.cause.message).to.be.equals('Shit!');
        expect(err.ownStack).to.be.exists();
        hemera.close();
        done();


      });

    });

  });

  it('Should crash on unhandled business errors', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      crashOnFatal: false
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

        throw new Error('Shit!');
      });

      hemera.act({
        topic: 'email',
        cmd: 'send',
        email: 'foobar@gmail.com',
        msg: 'Hi!'
      }, (err, resp) => {

        expect(err).to.be.exists();
        expect(err.name).to.be.equals('ImplementationError');
        expect(err.message).to.be.equals('Bad implementation');
        expect(err.cause.name).to.be.equals('Error');
        expect(err.cause.message).to.be.equals('Shit!');
        expect(err.ownStack).to.be.exists();
        hemera.close();
        done();


      });

    });

  });

  it('Pattern not found', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      hemera.add({
        topic: 'email',
        cmd: 'send'
      }, (resp, cb) => {

        cb();
      });

      hemera.act({
        topic: 'email',
        test: 'senddedede',
      }, (err, resp) => {

        expect(err).to.be.exists();
        expect(err.name).to.be.equals('PatternNotFound');
        expect(err.message).to.be.equals('No handler found for this pattern');
        hemera.close();
        done();


      });

    });

  });

});


describe('Plugin interface', function () {

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

  it('Should be able to use a plugin', function (done) {

    const nats = require('nats').connect(authUrl);

    const hemera = new Hemera({
      timeout: 200
    });

    Hemera.transport = nats;

    hemera.ready(() => {

      let pluginOptions = {
        a: '1'
      };

      //Plugin
      let plugin = function (options) {

        let hemera = this;

        expect(options.a).to.be.equals('1');

        hemera.add({
          topic: 'math',
          cmd: 'add'
        }, (resp, cb) => {

          cb(null, {
            result: resp.a + resp.b
          });
        });

        return {
          name: 'myPlugin'
        };

      };

      hemera.use(plugin, pluginOptions);

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).to.be.not.exists();
        expect(resp).not.to.be.equals(3);
        hemera.close();
        done();
      });

    });

  });

});