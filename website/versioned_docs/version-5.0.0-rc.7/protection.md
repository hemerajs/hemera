---
id: version-5.0.0-rc.7-protection
title: Built in protection
sidebar_label: Protection
original_id: protection
---

Hemera has some important built in protection capabilities:

* **Process policy**: Will cancel the incoming request and return an error when the policy (memory, event loop) could not be fullfilled (Option: `heavy`).
* **Message loop detection**: Will cancel the request and return an error if you call a route recursively (Option: `maxRecursion`).
* **Auto-pruning**: NATS automatically handles a slow consumer and cut it off. You are responsible to use a process-manager.

## Circuit breaker

A [circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html) is an important mechanism to provide stability and prevent cascading failures in distributed systems. We don't implement it in the core but the community provide great plugins which work very well with hemera.

- [easy-breaker](https://github.com/delvedor/easy-breaker)
- [levee](https://github.com/krakenjs/levee)