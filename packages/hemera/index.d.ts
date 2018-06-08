/// <reference types="node" />

import * as pino from 'pino'
import { Stream } from 'stream'

declare namespace Hemera {
  type LogLevel =
    | 'fatal'
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'trace'
    | 'silent'

  interface ErrioConfig {
    recursive?: boolean
    inherited?: boolean
    stack?: boolean
    private?: boolean
    exclude?: any
    include?: any
  }

  interface BloomrunConfig {
    indexing: 'insertion' | 'depth'
    lookupBeforeAdd: boolean
  }

  interface LogFn {
    (msg: string, ...args: any[]): void
    (obj: object, msg?: string, ...args: any[]): void
  }

  interface Logger {
    fatal: LogFn
    error: LogFn
    warn: LogFn
    info: LogFn
    debug: LogFn
    trace: LogFn
  }

  interface NodeCallback {
    (error?: Error | null | undefined, success?: any): void
  }

  interface HemeraMessagePayload {
    request: Request$
    meta: any
    trace: Trace$
    result: any
    error: Error | null
  }

  interface Config {
    timeout?: number | 2000
    pluginTimeout?: number
    tag?: string
    prettyLog?: boolean
    name?: string
    logLevel?: LogLevel
    childLogger?: boolean
    maxRecursion?: number
    logger?: Logger | Stream
    errio?: ErrioConfig
    bloomrun?: BloomrunConfig
    load?: LoadConfig
    traceLog?: boolean
  }

  interface LoadConfig {
    checkPolicy?: boolean
    shouldCrash?: boolean
    process?: LoadProcessConfig
    policy?: LoadPolicyConfig
  }

  interface LoadPolicyConfig {
    maxHeapUsedBytes?: number
    maxRssBytes?: number
    maxEventLoopDelay?: number
  }

  interface LoadProcessConfig {
    sampleInterval?: number
  }

  interface ClientPattern {
    topic: string
    pubsub$?: boolean
    timeout$?: number
    maxMessages$?: number
    expectedMessages$?: number
    [key: string]: any
  }

  interface ServerPattern {
    topic: string
    pubsub$?: boolean
    maxMessages$?: number
    [key: string]: any
  }

  type ClientResult = any

  type ActHandler = (
    this: Hemera<ClientRequest, ClientResponse>,
    error: Error,
    response: ClientResult
  ) => void

  type Plugin = Function

  interface AddDefinition {
    schema: object
    pattern: ServerPattern
    action: Function
    sid: number
    transport: {
      topic: string
      pubsub: boolean
      maxMessages: number
      queue: string
    }
    // callback
    use(
      handler: (
        request: Request,
        response: Response,
        next: Hemera.NodeCallback
      ) => void
    ): AddDefinition
    use(
      handler: ((
        request: Request,
        response: Response,
        next: Hemera.NodeCallback
      ) => void)[]
    ): AddDefinition
    // promise
    use(
      handler: (request: Request, response: Response) => Promise<void>
    ): AddDefinition
    use(
      handler: ((request: Request, response: Response) => Promise<void>)[]
    ): AddDefinition
    end(action: (request: ServerPattern, cb: NodeCallback) => void): void
    end(action: (request: ServerPattern) => Promise<any>): void
  }

  interface EncoderResult {
    value: string | Buffer
    error: Error
  }
  interface DecoderResult {
    value: object
    error: Error
  }

  type Response = null
  type Request = null

  interface ServerRequest {
    payload: HemeraMessagePayload
    error: Error
  }

  interface ClientRequest {
    payload: HemeraMessagePayload
    error: Error
    pattern: ClientPattern
    transport: {
      topic: string
      pubsub: boolean
      maxMessages: number
      expectedMessages: number
    }
  }

  interface ServerResponse {
    payload: HemeraMessagePayload
    error: Error
  }

  interface ClientResponse {
    payload: HemeraMessagePayload
    error: Error
  }

  interface Reply {
    log: pino.Logger | Logger
    payload: HemeraMessagePayload
    error: Error
    sent: boolean
    next: (message: Error | any) => void
    send: (message: Error | any) => void
  }

  type ActPromiseResult = {
    data: any
    context: Hemera<ClientRequest, ClientResponse>
  }

  type NoContext = null

  interface Request$ {
    id: string
    type: 'pubsub' | 'request'
  }

  interface Trace$ {
    traceId: string
    parentSpanId: string
    spanId: string
    timestamp: number
    service: string
    method: string
    duration: number
  }
}

declare class Hemera<Request, Response> {
  constructor(transport: object, config: Hemera.Config)
  // act
  act(pattern: string | Hemera.ClientPattern, handler: Hemera.ActHandler): void
  act(pattern: string | Hemera.ClientPattern): Promise<Hemera.ActPromiseResult>

  // add
  add(
    pattern: string | Hemera.ServerPattern,
    handler: (
      this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerPattern,
      callback: Hemera.NodeCallback
    ) => void
  ): Hemera.AddDefinition
  add(
    pattern: string | Hemera.ServerPattern,
    handler: (
      this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerPattern
    ) => Promise<any>
  ): Hemera.AddDefinition
  add(pattern: string | Hemera.ServerPattern): Hemera.AddDefinition

  // plugin
  use(
    plugin: (
      instance: Hemera<Hemera.Request, Hemera.Response>,
      opts: object,
      callback: Hemera.NodeCallback
    ) => void,
    options?: object
  ): void
  use(
    plugin: (
      instance: Hemera<Hemera.Request, Hemera.Response>,
      opts: object
    ) => Promise<void>,
    options?: object
  ): void

  remove(topic: string | number, maxMessages: number): boolean
  list(Pattern: any, options: any): Array<Hemera.AddDefinition>
  fatal(): void

  close(closeListener: (error?: Error) => void): void
  close(): Promise<void>

  decorate(
    name: string,
    decoration: any,
    dependencies?: Array<string>
  ): Hemera<Hemera.Request, Hemera.Response>
  hasDecorator(name: string): Boolean

  expose(
    name: string,
    exposition: any,
    dependencies?: Array<string>
  ): Hemera<Hemera.Request, Hemera.Response>

  createError(name: string): any

  // application extensions
  ext(
    name: 'onAdd',
    handler: (addDefinition: Hemera.AddDefinition) => void
  ): Hemera<Hemera.Request, Hemera.Response>

  ext(
    name: 'onClose',
    handler: (
      instance: Hemera<Hemera.NoContext, Hemera.NoContext>,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<null, null>
  ext(name: 'onClose'): Promise<void>

  // client extensions
  ext(
    name: 'onClientPreRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
  ext(
    name: 'onClientPreRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
    ) => Promise<void>
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>

  ext(
    name: 'onClientPostRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
  ext(
    name: 'onClientPostRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
    ) => Promise<void>
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>

  ext(
    name: 'onClientPreRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
  ext(
    name: 'onClientPreRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
    ) => Promise<void>
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>

  ext(
    name: 'onClientPostRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
  ext(
    name: 'onClientPostRequest',
    handler: (
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
    ) => Promise<void>
  ): Hemera<Hemera.ClientRequest, Hemera.ClientResponse>

  // server extensions
  ext(
    name: 'onServerPreHandler',
    handler: (
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerRequest,
      reply: Hemera.Reply,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<Hemera.ServerRequest, Hemera.ServerResponse>
  ext(
    name: 'onServerPreHandler',
    handler: (
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerRequest,
      reply: Hemera.Reply
    ) => Promise<void>
  ): Hemera<Hemera.ServerRequest, Hemera.ServerResponse>

  ext(
    name: 'onServerPreRequest',
    handler: (
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerRequest,
      reply: Hemera.Reply,
      next: Hemera.NodeCallback
    ) => void
  ): Hemera<Hemera.ServerRequest, Hemera.ServerResponse>
  ext(
    name: 'onServerPreRequest',
    handler: (
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerRequest,
      reply: Hemera.Reply
    ) => Promise<void>
  ): Hemera<Hemera.ServerRequest, Hemera.ServerResponse>

  ext(
    name: 'onServerPreResponse',
    handler: (
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerRequest,
      reply: Hemera.Reply,
      next: (err?: Error) => void
    ) => void
  ): Hemera<Hemera.ServerRequest, Hemera.ServerResponse>
  ext(
    name: 'onServerPreResponse',
    handler: (
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      request: Hemera.ServerRequest,
      reply: Hemera.Reply
    ) => Promise<void>
  ): Hemera<Hemera.ServerRequest, Hemera.ServerResponse>

  // events
  on(
    event: 'clientPreRequest',
    handler: (
      this: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
    ) => void
  ): Hemera<Request, Response>
  on(
    event: 'clientPostRequest',
    handler: (
      this: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      instance: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>
    ) => void
  ): Hemera<Request, Response>
  on(
    event: 'serverPreHandler',
    handler: (
      this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>
    ) => void
  ): Hemera<Request, Response>
  on(
    event: 'serverPreRequest',
    handler: (
      this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>
    ) => void
  ): Hemera<Request, Response>
  on(
    event: 'serverPreResponse',
    handler: (
      this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      instance: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>
    ) => void
  ): Hemera<Request, Response>
  on(
    event: 'serverResponseError',
    handler: (
      this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
      error: Error
    ) => void
  ): void
  on(
    event: 'clientResponseError',
    handler: (
      this: Hemera<Hemera.ClientRequest, Hemera.ClientResponse>,
      error: Error
    ) => void
  ): void

  ready(): Promise<void>
  ready(readyListener: (err: Error) => void): void

  removeAll(): any

  // serialization
  setClientEncoder(
    encoder: (message: Object | Buffer) => Hemera.EncoderResult
  ): Hemera<Request, Response>
  setClientDecoder(
    encoder: (message: String | Buffer) => Hemera.DecoderResult
  ): Hemera<Request, Response>
  setServerEncoder(
    encoder: (message: Object | Buffer) => Hemera.EncoderResult
  ): Hemera<Request, Response>
  setServerDecoder(
    encoder: (message: String | Buffer) => Hemera.DecoderResult
  ): Hemera<Request, Response>

  setSchemaCompiler(
    compilerFunction: (schema: Object) => Function
  ): Hemera<Request, Response>
  setSchemaCompiler(
    compilerFunction: (schema: Object) => Promise<any>
  ): Hemera<Request, Response>

  setResponseSchemaCompiler(
    compilerFunction: (schema: Object) => Function
  ): Hemera<Request, Response>
  setResponseSchemaCompiler(
    compilerFunction: (schema: Object) => Promise<any>
  ): Hemera<Request, Response>

  setNotFoundPattern(pattern: string | Hemera.ServerPattern | null): void

  setIdGenerator(
    generatorFunction: () => string
  ): Hemera<Hemera.Request, Hemera.Response>
  checkPluginDependencies(plugin: Hemera.Plugin): void

  log: pino.Logger | Hemera.Logger

  router: any
  load: any
  errors: { [key: string]: Error }
  config: Hemera.Config
  topics: { [key: string]: number }
  transport: any
  notFoundPattern: Hemera.ServerPattern

  matchedAction: Hemera.AddDefinition
  request: Request
  response: Response

  context$: any
  meta$: any
  delegate$: any
  auth$: any
  trace$: Hemera.Trace$
  request$: Hemera.Request$
}

export = Hemera
