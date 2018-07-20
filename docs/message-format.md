---
id: message-format
title: Message format
sidebar_label: Message format
---

This is the hemera message format described in [typescript](https://www.typescriptlang.org/index.html). You can use it to implement new hemera clients in other languages but you don't have to implement the NATS driver because there are already many [clients](https://github.com/nats-io/) for different languages available.

```ts
type Pattern = Object
type Result = Any
type Delegate = Object
type Meta = Object

interface Message {
  trace: Trace
  request: Request
  result: Result
  error: HError | null
  meta: Meta
  delegate?: Delegate
}

interface HError extends Error {
  code?: string
  [key: string]: Any
}

interface Request {
  id: string
  type: RequestType
  service: string
  method: string
}

interface Trace {
  traceId: string
  spanId: string
  timestamp: number
  service: string
  method: string
  parentSpanId?: string
  duration?: number
}

enum RequestType {
  request = 'request',
  pubsub = 'pubsub'
}
```
