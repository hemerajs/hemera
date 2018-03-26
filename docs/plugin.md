---
id: plugin
title: Plugin
sidebar_label: Plugin
---

Hemera's plugin system based on the powerful [Avvio](https://github.com/mcollina/avvio) package. Avvio is fully reentrant and graph-based. You can load components/plugins within plugins, and be still sure that things will happen in the right order.

> Plugins should encourage you to encapsulate a domain specific context in a reusable piece of software. Great practice is to seperate plugins by a different topic name.

## Plugin helper library

Before we get into the plugin system of hemera you have to install a package called [`hemera-plugin`](https://github.com/hemerajs/hemera/tree/master/packages/hemera-plugin). This package can do some things for you:

* Check the bare-minimum version of Hemera
* Provide consistent interface to register plugins even when the api is changed
* Pass metadata to intialize your plugin with correct dependencies, default options and name
* Skip the creation of a seperate plugins scope

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
})

module.exports = myPlugin
```

## Encapsulation

Plugins will create its own scope by default. This means that a child plugin can never manipulate its upper scope but child plugins. If you register an extension inside a plugin only child plugins will be effected.

```js
const hp = require('hemera-plugin')
const myPlugin = hp((hemera, opts, done) => {
  const topic = 'math'

  hemera.ext('onClientPostRequest', function(ctx, next) {
    // some code
    next()
  })

  done()
})

hemera.use(myPlugin)
```

### Decorators

Decorators are something special. Even if you create a plugin scope you can decorate the parent scope as well as child plugins. Decorators are primarly used to expose data or functionality to other plugins.

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

### Global registration

Sometimes it is still useful to write a plugin which effects the whole application with all scopes included. You can disable the creation of an plugin scope with `scoped: false` property.
This approach is used for payload validators like `hemera-joi` or authentication `hemera-jwt`.

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

You can also pass an async function.

```js
const hp = require('hemera-plugin')
const myPlugin = hp(
  (hemera, opts, done) => {
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
  },
  {
    hemera: '0.x', // bare-minimum version of Hemera
    name: 'my-plugin', // name of your plugin, will be used e.g for logging purposes
    dependencies: ['plugin2'], // won't be checked until you use `hemera.checkPluginDependencies(plugin)`
    options: { host: 'localhost', port: 8003 } // default options for your plugin
  }
)

hemera.use(myPlugin)
```

## Async / Await

You can also pass an async function.

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

Calls a function after all previous registrations are loaded, including all their dependencies.

```js
hemera.use(plugin).after(cb)
// or
hemera.use(plugin)
hemera.after(cb)
```
