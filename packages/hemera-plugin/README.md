# Hemera-plugin package

[![npm](https://img.shields.io/npm/v/hemera-plugin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-plugin)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

`hemera-plugin` is a plugin helper for [Hemera](https://github.com/hemerajs/hemera).  

## Usage
`hemera-plugin` can do some things for you:
- Check the bare-minimum version of Hemera
- Provide consistent interface to register plugins even when the api is changed
- Pass metadata to intialize your plugin with correct dependencies, default options and name. 

Example:
```js
const hp = require('hemera-plugin')

module.exports = hp(function (hemera, opts, next) {
  next()
})
```

If you need to set a bare-minimum version of Hemera for your plugin, just add the [semver](http://semver.org/) range that you need:
```js
const hp = require('hemera-plugin')

module.exports = hp(function (hemera, opts, next) {
  next()
}, '0.x')
```

You can check [here](https://github.com/npm/node-semver#ranges) how to define a `semver` range.

## Async / Await
```js
const hp = require('hemera-plugin')

module.exports = hp(async function (hemera, opts) {
  // your plugin code
}, '0.x')
```

You can also pass some metadata that will be handled by Hemera, such as the dependencies, default options and the name of your plugin.
```js
const hp = require('hemera-plugin')

function plugin (hemera, opts, next) {
  // your plugin code
  next()
}

module.exports = hp(plugin, {
  hemera: '0.x', // bare-minimum version of Hemera
  name: 'my-plugin', // name of your plugin, will be used e.g for logging purposes
  dependencies: ['plugin2'], // won't be checked until you use `hemera.checkPluginDependencies(plugin)`
  skipOverride: false, // when true no hemera plugin is created. This is useful if you want to extend the core but don't need a plugin scope.
  options: { host: 'localhost', port: 8003 } // default options for your plugin
})
```

### Credits 
[fastify-plugin](https://github.com/fastify/fastify-plugin)
