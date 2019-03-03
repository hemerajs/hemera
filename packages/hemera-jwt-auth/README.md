# Hemera-jwt-auth package

Granting and authenticating solution with JWT for Hemera

[![npm](https://img.shields.io/npm/v/hemera-jwt-auth.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jwt-auth)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

## Usage

```js
const hemera = new Hemera(nats)
hemera.use(require('hemera-jwt'), {
  enforceAuth: true // set to false if you want to enable it selectively
  jwt: {
    secret: '<secret>'
  }
})
```

## JWT Payload signature

- `scope`: Defines a set of rights (`Array<string>` or `string`)

```json
{ "scope": ["math"] }
```

## Example

For a full example see [here](/examples/authentication/jwt.js)

## Plugin decorators

* .jwtErrors
