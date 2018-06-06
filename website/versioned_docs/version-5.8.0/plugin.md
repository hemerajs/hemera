---
id: version-5.8.0-plugin
title: Plugin
sidebar_label: Plugin
original_id: plugin
---

Hemera's plugin system based on the powerful [Avvio](https://github.com/mcollina/avvio) package. Avvio is fully reentrant and graph-based. You can load components/plugins within plugins, and be still sure that things will happen in the right order.

> Plugins should encourage you to encapsulate a domain specific context in a reusable piece of software. Great practice is to seperate plugins by a different topic name.

## Plugin helper library

Before we get into the plugin system of hemera you have to install a package called [`hemera-plugin`](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin). This package can do some things for you:

* Check the bare-minimum version of Hemera
* Provide consistent interface to register plugins even when the api is changed
* Pass metadata to intialize your plugin with correct dependencies, default options and name
* Skip plugin encapsulation

## Create a plugin

```js
const hp = require('hemera-plugin')
const myPlugin = hp((hemera, opts, done) => {
  const topic = 'math'

  hemera.add(
    {
      topic,
      cmd: 'add'
    },
    function(req, cb) {
      cb(null, {
        result: req.a + req.b
      })
    }
  )

  done()
}, '>=5.0.0')

module.exports = myPlugin
```

## Break encapsulation

Sometimes it is still useful to write a plugin which effects child as well as sibling scopes. You can archive this with plugin option `scoped: false` property. This approach is used in payload validators `hemera-joi` or authentication `hemera-jwt`.

```js
const hp = require('hemera-plugin')
const myPlugin = hp((hemera, opts, done) => {
  const topic = 'math'

  hemera.ext('onClientPostRequest', function(ctx, next) {
    // some code
    next()
  })

  done()
}, { scoped: false })

hemera.use(myPlugin)
```

## Register child plugins

You can load plugins inside other plugins. Be ware that [**Scoped sensitive settings**](#scoped-sensitive-settings) are effected.

```js
const hp = require('hemera-plugin')
const myPlugin = hp((hemera, opts, done) => {
  const topic = 'math'

  hemera.ext('onClientPostRequest', function(ctx, next) {
    // some code
    next()
  })

  hemera.use(
    hp((hemera, opts, done) => {
      // some code
      // this plugin will be effected by the 'onClientPostRequest' extension
      done()
    })
  )

  done()
})
```

### Decorators

Decorators are something special. Even if you create a plugin scope you can decorate the root hemera instance. Decorators are primarly used to expose data or functionality to other plugins.

```js
const hp = require('hemera-plugin')
const myPlugin = hp((hemera, opts, done) => {
  const topic = 'math'

  hemera.decorate('test', 1)

  done()
})

hemera.use(myPlugin)
hemera.ready(() => console.log(hemera.test))
```

### Expose

If you want to share data inside a plugin you can use `expose()` it will effects all sibling and child scopes. Expose should be used to control the inner workings of the plugin.

```js
const hp = require('hemera-plugin')
const myPlugin = hp((hemera, opts, done) => {
  const topic = 'math'

  hemera.expose('cache', new Map())
  hemera.cache.set('key', 'value')

  hemera.use(myPlugin2) // cache is available in this plugin too

  done()
})

hemera.use(myPlugin)
hemera.ready()
```

### Global registration

Sometimes it's still useful to write a plugin which effects sibling and child scopes. You can disable the creation of a plugin scope with the `scoped: false` property.
This approach is used in payload validators `hemera-joi` or authentication plugins like `hemera-jwt`.

```js
const hp = require('hemera-plugin')
const myPlugin = hp(
  (hemera, opts, done) => {
    const topic = 'math'

    hemera.ext('onServerPreRequest', function(ctx, next) {
      // some code
      next()
    })

    done()
  },
  {
    scoped: false
  }
)

hemera.use(myPlugin)
```

### Scoped sensitive settings

* [Request/Response Extensions](extension.md#server-client-lifecycle)
* [Decorators](decorator.md)
* [Schema Compilers](payload-validation.md#use-your-custom-validator)
* [Codecs](codec.md)
* [Not found pattern](notfound-pattern.md)

## Add plugin metadata

```js
const hp = require('hemera-plugin')
const myPlugin = hp(
  async (hemera, opts) => {
    const topic = 'math'

    hemera.add(
      {
        topic,
        cmd: 'add'
      },
      function(req, cb) {
        cb(null, {
          result: req.a + req.b
        })
      }
    )
  },
  {
    hemera: '0.x', // bare-minimum version of Hemera
    name: 'my-plugin', // name of your plugin, will be used e.g for logging purposes
    options: { host: 'localhost', port: 8003 }, // default options for your plugin
    dependencies: ['plugin2'],
    decorators: ['joi']
  }
)

hemera.use(myPlugin)
```

## Plugin depdendencies

You can declare plugins and decorators as dependencies. The constrains are checked when all plugins are registered.

```js
const hp = require('hemera-plugin')
const myPlugin = hp(
  (hemera, opts, done) => {
    const Joi = hemera.joi

    done()
  },
  {
    dependencies: ['plugin2'],
    decorators: ['joi']
  }
)

hemera.use(myPlugin)
hemera.ready(err => {
  // The dependency 'hemera-joi' is not registered
})
```

## Async / Await

You can also pass an async function and omit the `done` callback.

```js
const hp = require('hemera-plugin')
const myPlugin = hp(async (hemera, opts) => {
  const topic = 'math'

  hemera.add(
    {
      topic,
      cmd: 'add'
    },
    function(req, cb) {
      cb(null, {
        result: req.a + req.b
      })
    }
  )
})
```

## Plugin registration

A plugin must be registered before the `ready` function is called. The ready function will initialize all plugins. Default plugin options are preserved if you don't overwrite them.

```js
hemera.use(plugin, { a: 1 })
```

## After

Calls a function after all previous registrations are loaded, including all their dependencies. This can be used to defer the registration of a plugin.

```js
hemera.use(plugin).after(cb)
// or
hemera.use(plugin)
hemera.after(cb)
```
