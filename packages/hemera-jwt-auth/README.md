# Hemera-jwt-auth package

Granting and authenticating solution with JWT for Hemera

[![npm](https://img.shields.io/npm/v/hemera-jwt-auth.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-jwt-auth)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

## Usage

```js
// token encoded with { scope: ['math'] }
const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJtYXRoIl0sImlhdCI6MTQ4ODEyMjIwN30.UPLLbjDgkB_ajQjI7BUlpUGfZYvsqHP3NqWQIavibeQ'
const hemera = new Hemera(nats)
hemera.use(require('hemera-jwt'), {
  enforceAuth: true // set to false if you want to enable it selectively
  jwt: {
    secret: 'test'
  }
})
```

## Plugin decorators

* .jwtErrors
