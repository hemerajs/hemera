---
id: reference
title: Reference
sidebar_label: Reference
---

## Static

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

Update the current request schema compiler.

```js
hemera.setSchemaCompiler(fn)
```

### Hemera.setResponseSchemaCompiler()

Update the current response schema compiler.

```js
hemera.setSchemaCompiler(fn)
```

### Hemera.setServerDecoder()

Update the server decoder.

```js
hemera.setServerDecoder(fn)
```

### Hemera.setServerEncoder()

Update the server encoder.

```js
hemera.setServerEncoder(fn)
```

### Hemera.setClientDecoder()

Update the client decoder.

```js
hemera.setClientDecoder(fn)
```

### Hemera.setClientEncoder()

Update the client encoder.

```js
hemera.setClientEncoder(fn)
```

### Hemera.setNotFoundPattern()

Update the notFound Pattern.

```js
hemera.setNotFoundPattern(fn)
```

### Hemera.checkPluginDependencies()

Verifies the plugin dependecies are installed.

```js
hemera.checkPluginDependencies()
```

### Hemera.hasDecorator()

Return a boolean whether the decorator is available.

```js
hemera.hasDecorator(string)
```

### Hemera.decorate()

Decorate the core hemera instance with the value.

```js
hemera.decorate(name, value)
```

### Hemera.expose()

Expose a value to the current hemera instance.

```js
hemera.expose(name, value)
```

### Hemera.use()

Register a plugin.

```js
hemera.use(plugin, options)
```

### Hemera.createError()

Create a new native error which can be serialized and deserialized across processe.

```js
hemera.createError(name)
```

### Hemera.fatal()

Gracefully shutdown hemera and exit the process with code `1`

```js
hemera.fatal()
```

### Hemera.ready()

Bootstrap hemera and all plugins.

```js
hemera.ready(cb)
```

### Hemera.subscribe()

Create a new server action.

```js
hemera.subscribe(pattern, cb)
```

### Hemera.act()

Start a new request.

```js
hemera.act(pattern, cb)
```

### Hemera.remove()

Removes a single subscription by id or a whole service by topic name.

```js
hemera.remove(topic)
```

### Hemera.list()

Returns all registered server actions.

```js
hemera.list()
```

### Hemera.close()

Gracefully shutdown hemera. Can be called only once. If you are looking for to register multiple handlers look at the
`onClose` extension.

```js
hemera.close(fn)
```

### Hemera.router

Returns the `bloomrun` instance.

```js
hemera.router
```

### Hemera.load

Returns the `load` instance.

```js
hemera.load
```

### Hemera.transport

Returns the abstract transport implementation for NATS.

```js
hemera.transport
```

### Hemera.topics

Returns all registered topcis.

```js
hemera.topics
```

### Hemera.config

Returns the hemera configuration.

```js
hemera.config
```

### Hemera.notFoundPattern

Returns the notFound Pattern.

```js
hemera.notFoundPattern
```

### Hemera.request

Returns the current client/server request object.

```js
hemera.request
```

### Hemera.response

Returns the current client/server response object.

```js
hemera.response
```

### Hemera.reply

Returns the current server reply object.

```js
hemera.reply
```
