---
id: version-5.1.2-decorator
title: Decorators
sidebar_label: Decorators
original_id: decorator
---

Sometimes it is useful to share data across plugins. This data can be accessed from parent and all child plugins. You can also declare other decorators as dependencies.

```js
hemera.decorate("magicNumber", fn)
hemera.magicNumber
```

## Add decorator dependencies

You can also pass an async function.

```js
hemera.decorate("magicNumber", fn, ['dep1', 'dep2'])
hemera.magicNumber
```
