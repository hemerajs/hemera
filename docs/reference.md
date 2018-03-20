---
id: reference
title: Reference
sidebar_label: Reference
---

## Static

### errors

```js
Hemera.errors
```

## Members

### Hemera.ext()

```js
hemera.ext(type, fn)
```

Register a new extension handler.

### Hemera.setIdGenerator()

Updates the id generator. The generator is a synchronous function that will be used to generate identifiers for tracing.
The default function generates random identifiers with a length of 16 characters.

```js
hemera.setIdGenerator(fn)
```

### Hemera.setSchemaCompiler()

```js
hemera.setSchemaCompiler(fn)
```

Update the current schema compiler.

### Hemera.setServerDecoder()

```js
hemera.setServerDecoder(fn)
```

Update the server decoder.

### Hemera.setServerEncoder()

```js
hemera.setServerEncoder(fn)
```

Update the server encoder.

### Hemera.setClientDecoder()

```js
hemera.setClientDecoder(fn)
```

Update the client decoder.

### Hemera.setClientEncoder()

```js
hemera.setClientEncoder(fn)
```

Update the client encoder.

### Hemera.checkPluginDependencies()

```js
hemera.checkPluginDependencies()
```

Verifies the plugin dependecies are installed.

### Hemera.hasDecorator()

```js
hemera.hasDecorator(string)
```

Return a boolean whether the decorator is available.

### Hemera.decorate()

```js
hemera.decorate(name, value)
```

Decorate the current instance with the value.

### Hemera.use()

```js
hemera.use(plugin, options)
```

Register a plugin.

### Hemera.createError()

```js
hemera.createError(name)
```

Create a new native error which can be serialized and deserialized across processe.

### Hemera.fatal()

```js
hemera.fatal()
```

Gracefully shutdown hemera and exit the process with `1`

### Hemera.ready()

```js
hemera.ready(cb)
```

Bootstrap hemera and all plugins.

### Hemera.subscribe()

```js
hemera.subscribe(pattern, cb)
```

### Hemera.act()

```js
hemera.act(pattern, cb)
```

### Hemera.remove()

```js
hemera.remove(topic)
```

Removes a single subscription by id or a whole service by topic name.

### Hemera.list()

```js
hemera.list()
```

Returns all registered server actions.

### Hemera.close()

```js
hemera.close()
```

Gracefully shutdown hemera.

### Hemera.router

```js
hemera.router
```

Returns the `bloomrun` instance.

### Hemera.load

```js
hemera.load
```

Returns the `load` instance.

### Hemera.transport

```js
hemera.transport
```

Returns the abstract transport implementation for NATS.

### Hemera.topics

```js
hemera.topics
```

Returns all registered topcis.

### Hemera.config

```js
hemera.config
```

Returns the hemera configuration.
