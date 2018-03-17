---
id: plugin
title: Plugin
sidebar_label: Create a plugin
---

Hemera's plugin system based on the powerful [Avvio](https://github.com/mcollina/avvio) package. Avvio is fully reentrant and graph-based. You can load components/plugins within plugins, and be still sure that things will happen in the right order. You can create a plugin in two different ways:

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
hemera.use([plugin, ...], { a: 1 })
```

## After

Calls a function after all plugins are loaded, including all their dependencies.

```js
hemera.use(plugin).after(cb)
// or
hemera.use(plugin)
hemera.after(cb)
```
