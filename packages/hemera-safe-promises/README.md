# Hemera-safe-promises package

A node.js module to make the use of promises safe. It implements the deprecation DEP0018 of Node.js in versions 6, 7 and 8. Using Promises without this module might cause file descriptor and memory leaks.

[![npm](https://img.shields.io/npm/v/hemera-safe-promises.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-safe-promises)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

## Install
```
npm i hemera-safe-promises --save
```

## Usage

```js
hemera.use(require('hemera-safe-promises'))
```

## Credits

[make-promises-safe](https://github.com/mcollina/make-promises-safe)
