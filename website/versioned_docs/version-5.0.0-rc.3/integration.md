---
id: version-5.0.0-rc.3-integration
title: Integration-test
sidebar_label: Integration
original_id: integration
---

We provide a simple package called [hemera-testsuite](https://github.com/hemerajs/hemera-testsuite) to start a NATS Server programmatically.

### Prerequisites

- Installed NATS Server, included in the user `PATH` environment variable.

```js
const server = HemeraTestsuite.start_server(PORT, done)
server.kill()
```

## Example mocha test

```js
describe('Basic', function() {
  const PORT = 6242
  const natsUrl = 'nats://localhost:' + PORT
  let server

  // Start up our own nats-server
  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function() {
    server.kill()
  })

  it('Should send and receive', function(done) {
    const nats = require('nats').connect(natsUrl)
    const hemera = new Hemera(nats)
    
    hemera.ready(() => {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        (resp, cb) => {
          cb(null, resp.a.number + resp.b.number)
        }
      )
      hemera.act(
        {
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        },
        (err, resp) => {
          expect(err).not.to.be.exists()
          expect(resp).to.be.equals(3)
          hemera.close(done)
        }
      )
    })
  })
})
```
