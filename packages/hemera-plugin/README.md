# Hemera-plugin package

[![npm](https://img.shields.io/npm/v/hemera-plugin.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-plugin)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

`hemera-plugin` is a plugin helper for [Hemera](https://github.com/hemerajs/hemera).  

#### Usage
`hemera-plugin` can do some things for you:
- Check the bare-minimum version of Hemera
- Provide consistent interface to register plugins even when the api is changed

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

#### Credits 
[fastify-plugin](https://github.com/fastify/fastify-plugin)
