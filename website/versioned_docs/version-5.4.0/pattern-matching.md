---
id: version-5.4.0-pattern-matching
title: Pattern matching
sidebar_label: Pattern matching
original_id: pattern-matching
---

Hemera provides two different ways to index your pattern efficiently. This functionality is provided by the [Bloomrun](https://github.com/mcollina/bloomrun) package a js pattern matcher with results that can be returned in `insertion` order or `depth` order. Inspired by bloom filters.

## Insertion order

By default all patterns are indexed in insertion order.

```js
const hemera = new Hemera({
  bloomrun: {
    indexing: 'insertion'
  }
})

// Matched
hemera.add(
  {
    topic: 'service',
    cmd: 'a'
  },
  function(req, cb) {
    cb(null, 1)
  }
)

hemera.add(
  {
    topic: 'service',
    cmd: 'a',
    foo: 'bar'
  },
  function(req, cb) {
    cb(null, 2)
  }
)
hemera.act({
  topic: 'service',
  cmd: 'a',
  foo: 'bar'
}) // return 1
```

## Depth order

Depth indexing provides you more flexibility.

```js
const hemera = new Hemera({
  bloomrun: {
    indexing: 'depth'
  }
})

hemera.add(
  {
    topic: 'service',
    cmd: 'a'
  },
  function(req, cb) {
    cb(null, 1)
  }
)

// Matched
hemera.add(
  {
    topic: 'service',
    cmd: 'a',
    foo: 'bar'
  },
  function(req, cb) {
    cb(null, 2)
  }
)
hemera.act({
  topic: 'service',
  cmd: 'a',
  foo: 'bar'
}) // return 2
```

## What's a pattern?

Any javascript object with the combination of properties from type `boolean`, `string`, `regex` and `numbers`. Any other type like e.g `object` will be handled as payload. For more informations look in the [Bloomrun](https://github.com/mcollina/bloomrun) package.

## Pattern definition

You can define a pattern in two different ways:

* As JSON Object

  ```js
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    (req, cb) => {
      cb(null, req.a + req.b)
    }
  )
  hemera.act({
    topic: math,
    cmd: add,
    a: 1,
    b: 2
  })
  ```

* As quick syntax JSON Object provided by [tinysonic](https://github.com/mcollina/tinysonic) package.
  ```js
  hemera.add('topic:math,cmd:add', (req, cb) => {
    cb(null, req.a + req.b)
  })
  hemera.act('topic:math,cmd:add,a:1,b:2')
  ```

## Hemera $ properties

In Hemera we use special `$` suffixed properties to configure additional transport options in NATS. Please consider that those properties are not part of the pattern and will be ingored at pattern matching.
