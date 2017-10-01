'use strict'

const Code = require('code')
const Zipkin = require('./../lib')

const expect = Code.expect

const TO_MICROSECONDS = 1000

const Client = new Zipkin({
  sampling: 1
})

function now() {
  return new Date().getTime() * TO_MICROSECONDS
}

function noop() {}

describe('Zipkin client', function() {
  beforeEach(function resetTransport(done) {
    Client.options({
      transport: noop
    })
    done()
  })

  describe('options', function() {
    it('is possible to swap transport', function(done) {
      function dummyTransport(data) {
        expect(data).to.include(['traceId', 'name', 'id', 'annotations'])
        done()
      }

      Client.options({
        transport: dummyTransport
      })

      Client.sendClientSend(null, {
        service: 'test service',
        name: 'test name'
      })
    })

    it('it cant sets to http batch transport', function(done) {
      Client.options({
        transport: 'http'
      })
      expect(Client.send.name).to.equal('httpBatchTransport')

      done()
    })

    it('it cant sets to http simple transport', function(done) {
      Client.options({
        transport: 'http-simple'
      })
      expect(Client.send.name).to.equal('httpSimpleTransport')

      done()
    })
  })

  describe('Trace data manipulation', function() {
    describe('getChild', function() {
      it('should return data for child span', function(done) {
        const traceData = Client.getChild({
          traceId: 'test traceId',
          spanId: 'test spanId',
          parentSpanId: 'test parent_id',
          sampled: true
        })

        expect(traceData).to.include({
          traceId: 'test traceId',
          parentSpanId: 'test spanId',
          sampled: true
        })
        expect(traceData).to.include('spanId')

        done()
      })

      it('should carry the sampled state', function(done) {
        const traceData = Client.getChild({
          traceId: 'test traceId',
          spanId: 'test spanId',
          parentSpanId: 'test parent_id',
          sampled: false
        })

        expect(traceData.sampled).to.be.false()

        done()
      })

      it('provides a underscore alias', function(done) {
        expect(Client.get_child).to.equal(Client.getChild)
        done()
      })

      it('should ignore serverOnly attribute', function(done) {
        const traceData = Client.getChild({
          traceId: 'test traceId',
          spanId: 'test spanId',
          parentSpanId: 'test parent_id',
          sampled: true
        })

        expect(traceData).to.include({
          traceId: 'test traceId',
          parentSpanId: 'test spanId'
        })

        expect(traceData).to.not.include('serverù')

        done()
      })

      it('should create a root trace if none is passed', function(done) {
        const traceData = Client.getChild(null)
        expect(traceData).to.include(['traceId', 'spanId', 'sampled'])
        expect(traceData.parentSpanId).to.be.null()
        done()
      })
    })
  })

  describe('Standard annotations', function() {
    describe('sendClientSend', function() {
      const traceData = {
        traceId: 'test traceId',
        spanId: 'test spanId',
        parentSpanId: 'test parent_id',
        timestamp: now(),
        sampled: true
      }

      it('sends data to zipkin', function(done) {
        function testTransport(data) {
          try {
            expect(data).to.part.include({
              traceId: 'test traceId',
              name: 'test name',
              id: 'test spanId',
              timestamp: traceData.timestamp,
              annotations: [
                {
                  value: 'cs',
                  endpoint: {
                    serviceName: 'test service',
                    ipv4: 0,
                    port: 0
                  }
                }
              ],
              binaryAnnotations: []
            })
            expect(data.annotations[0]).to.include('timestamp')
            expect(data).to.not.include('duration')
          } catch (ex) {
            return done(ex)
          }

          done()
        }

        Client.options({
          transport: testTransport
        })
        Client.sendClientSend(traceData, {
          service: 'test service',
          name: 'test name'
        })
      })

      it('should create a new trace if none passed', function(done) {
        var data = Client.sendClientSend(null, {
          service: 'test service',
          name: 'test name'
        })

        expect(data).to.include(['traceId', 'spanId', 'timestamp', 'sampled'])
        expect(data.parentSpanId).to.be.null()
        expect(data.spanId).to.be.equal(data.traceId)
        done()
      })

      it('should not send data for not sampled traces', function(done) {
        function testTransport() {
          done("Shouldn't receive data")
        }

        Client.options({
          transport: testTransport
        })
        Client.sendClientSend(
          {
            sampled: false
          },
          {
            service: 'test service',
            name: 'test name'
          }
        )

        done()
      })

      it('provides a camel case alias', function(done) {
        expect(Client.send_client_send).to.equal(Client.sendClientSend)
        done()
      })
    })

    describe('sendClientRecv', function() {
      const traceData = {
        traceId: 'test traceId',
        spanId: 'test spanId',
        parentSpanId: 'test parent_id',
        timestamp: now(),
        sampled: true
      }

      it('sends data to zipkin', function(done) {
        function testTransport(data) {
          try {
            expect(data).to.part.include({
              traceId: 'test traceId',
              name: 'test name',
              id: 'test spanId',
              annotations: [
                {
                  value: 'cr',
                  endpoint: {
                    serviceName: 'test service',
                    ipv4: 0,
                    port: 0
                  }
                }
              ],
              binaryAnnotations: []
            })
            expect(data).to.not.include('timestamp')
            expect(data.annotations[0]).to.include('timestamp')
            expect(data.duration).to.equal(
              data.annotations[0].timestamp - traceData.timestamp
            )
          } catch (ex) {
            return done(ex)
          }

          done()
        }

        Client.options({
          transport: testTransport
        })
        Client.sendClientRecv(traceData, {
          service: 'test service',
          name: 'test name'
        })
      })

      it('provides a camel case alias', function(done) {
        expect(Client.send_client_recv).to.equal(Client.sendClientRecv)
        done()
      })
    })

    describe('sendServerSend', function() {
      const traceData = {
        traceId: 'test traceId',
        spanId: 'test spanId',
        parentSpanId: 'test parent_id',
        timestamp: now(),
        sampled: true
      }

      it('sends data to zipkin', function(done) {
        function testTransport(data) {
          try {
            expect(data).to.part.include({
              traceId: 'test traceId',
              name: 'test name',
              id: 'test spanId',
              annotations: [
                {
                  value: 'ss',
                  endpoint: {
                    serviceName: 'test service',
                    ipv4: 0,
                    port: 0
                  }
                }
              ],
              binaryAnnotations: []
            })
            expect(data).to.not.include('timestamp')
            expect(data.annotations[0]).to.include('timestamp')
            expect(data).to.not.include('duration')
          } catch (ex) {
            return done(ex)
          }

          done()
        }

        Client.options({
          transport: testTransport
        })
        Client.sendServerSend(traceData, {
          service: 'test service',
          name: 'test name'
        })
      })

      it('sends the duration on server only traces', function(done) {
        const traceData = {
          traceId: 'test traceId',
          spanId: 'test spanId',
          parentSpanId: 'test parent_id',
          timestamp: now(),
          sampled: true,
          serverOnly: true
        }

        function testTransport(data) {
          try {
            expect(data).to.part.include({
              traceId: 'test traceId',
              name: 'test name',
              id: 'test spanId',
              annotations: [
                {
                  value: 'ss',
                  endpoint: {
                    serviceName: 'test service',
                    ipv4: 0,
                    port: 0
                  }
                }
              ],
              binaryAnnotations: []
            })
            expect(data).to.not.include('timestamp')
            expect(data.annotations[0]).to.include('timestamp')
            expect(data.duration).to.equal(
              data.annotations[0].timestamp - traceData.timestamp
            )
          } catch (ex) {
            return done(ex)
          }

          done()
        }

        Client.options({
          transport: testTransport
        })
        Client.sendServerSend(traceData, {
          service: 'test service',
          name: 'test name'
        })
      })

      it('provides a camel case alias', function(done) {
        expect(Client.send_server_send).to.equal(Client.sendServerSend)
        done()
      })
    })

    describe('sendServerRecv', function() {
      const traceData = {
        traceId: 'test traceId',
        spanId: 'test spanId',
        parentSpanId: 'test parent_id',
        timestamp: now(),
        sampled: true
      }

      it('sends data to zipkin', function(done) {
        function testTransport(data) {
          try {
            expect(data).to.part.include({
              traceId: 'test traceId',
              name: 'test name',
              id: 'test spanId',
              annotations: [
                {
                  value: 'sr',
                  endpoint: {
                    serviceName: 'test service',
                    ipv4: 0,
                    port: 0
                  }
                }
              ],
              binaryAnnotations: []
            })
            expect(data).to.not.include('timestamp')
            expect(data.annotations[0]).to.include('timestamp')
            expect(data).to.not.include('duration')
          } catch (ex) {
            return done(ex)
          }

          done()
        }

        Client.options({
          transport: testTransport
        })
        Client.sendServerRecv(traceData, {
          service: 'test service',
          name: 'test name'
        })
      })

      it('sends timestamp and creates a serverOnly trace if no trace passed in', function(
        done
      ) {
        function testTransport(data) {
          try {
            expect(data).to.part.include({
              name: 'test name',
              annotations: [
                {
                  value: 'sr',
                  endpoint: {
                    serviceName: 'test service',
                    ipv4: 0,
                    port: 0
                  }
                }
              ],
              binaryAnnotations: []
            })
            expect(data).to.include('timestamp')
            expect(data.annotations[0]).to.include('timestamp')
            expect(data).to.not.include('duration')
          } catch (ex) {
            return done(ex)
          }

          done()
        }

        Client.options({
          transport: testTransport
        })
        const data = Client.sendServerRecv(null, {
          service: 'test service',
          name: 'test name'
        })

        expect(data.serverOnly).to.be.true()
      })

      it('provides a camel case alias', function(done) {
        expect(Client.send_server_recv).to.equal(Client.sendServerRecv)
        done()
      })
    })
  })
})
