/// <reference types="node" />

import * as pino from 'pino'
import { Stream } from 'stream'

// tslint:disable-next-line:export-just-namespace
export = Hemera
export as namespace Hemera

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
    logTraceDetails?: boolean
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

  type ActHandler = (this: Hemera, error: Error, response: ClientResult) => void

  type Plugin = Function

  interface AddDefinition {
    schema: object
    pattern: ServerPattern
    action: Function
    sid: number
    // callback
    use(
      handler: (
        request: Request,
        response: Response,
        next: (err?: Error) => void
      ) => void
    ): AddDefinition
    use(
      handler: ((
        request: Request,
        response: Response,
        next: (err?: Error) => void
      ) => void)[]
    ): AddDefinition
    // promise
    use(
      handler: (request: Request, response: Response) => Promise<void>
    ): AddDefinition
    use(
      handler: ((request: Request, response: Response) => Promise<void>)[]
    ): AddDefinition
    end(
      action: (
        request: ServerPattern,
        cb: (error?: Error, result?: any) => void
      ) => void
    ): void
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

  interface Request {
    payload: any
    error: Error
  }

  interface Response {
    payload: any
    error: Error
  }

  interface Reply {
    log: pino.Logger | Logger
    payload: any
    error: Error
    sent: boolean
    next: (payload: any) => void
    send: (payload: any) => void
  }

  type ActPromiseResult = {
    data: any
    context: Hemera
  }

  interface Request {
    id: string
    type: 'pubsub' | 'request'
  }

  interface Trace {
    traceId: string
    parentSpanId: string
    spanId: string
    timestamp: number
    service: string
    method: string
    duration: number
  }
}

declare class Hemera {
  constructor(transport: object, config: Hemera.Config)
  // act
  act(pattern: string | Hemera.ClientPattern, handler: Hemera.ActHandler): void
  act(pattern: string | Hemera.ClientPattern): Promise<Hemera.ActPromiseResult>

  // add
  add(
    pattern: string | Hemera.ServerPattern,
    handler: (
      this: Hemera,
      request: Hemera.ServerPattern,
      callback: (error?: Error) => void
    ) => void
  ): Hemera.AddDefinition
  add(
    pattern: string | Hemera.ServerPattern,
    handler: (this: Hemera, request: Hemera.ServerPattern) => Promise<any>
  ): Hemera.AddDefinition
  add(pattern: string | Hemera.ServerPattern): Hemera.AddDefinition

  // plugin
  use(
    plugin: (
      instance: Hemera,
      opts: object,
      callback: (err?: Error) => void
    ) => void,
    options?: object
  ): void
  use(
    plugin: (instance: Hemera, opts: object) => Promise<void>,
    options?: object
  ): void

  remove(topic: string | number, maxMessages: number): boolean
  list(Pattern: any, options: any): Array<Hemera.AddDefinition>
  fatal(): void

  close(closeListener: (error?: Error) => void): void
  close(): Promise<void>

  decorate(name: string, decoration: any, dependencies?: Array<string>): Hemera
  hasDecorator(name: string): Boolean

  expose(name: string, exposition: any, dependencies?: Array<string>): Hemera

  createError(name: string): any

  // application extensions
  ext(
    name: 'onAdd',
    handler: (addDefinition: Hemera.AddDefinition) => void
  ): Hemera

  ext(
    name: 'onClose',
    handler: (instance: Hemera, next: (err?: Error) => void) => void
  ): Hemera
  ext(name: 'onClose'): Promise<void>

  // client extensions
  ext(
    name: 'onClientPreRequest',
    handler: (instance: Hemera, next: (err?: Error) => void) => void
  ): Hemera
  ext(
    name: 'onClientPreRequest',
    handler: (instance: Hemera) => Promise<void>
  ): Hemera

  ext(
    name: 'onClientPostRequest',
    handler: (instance: Hemera, next: (err?: Error) => void) => void
  ): Hemera
  ext(
    name: 'onClientPostRequest',
    handler: (instance: Hemera) => Promise<void>
  ): Hemera

  ext(
    name: 'onClientPreRequest',
    handler: (instance: Hemera, next: (err?: Error) => void) => void
  ): Hemera
  ext(
    name: 'onClientPreRequest',
    handler: (instance: Hemera) => Promise<void>
  ): Hemera

  ext(
    name: 'onClientPostRequest',
    handler: (instance: Hemera, next: (err?: Error) => void) => void
  ): Hemera
  ext(
    name: 'onClientPostRequest',
    handler: (instance: Hemera) => Promise<void>
  ): Hemera

  // server extensions
  ext(
    name: 'onServerPreHandler',
    handler: (
      instance: Hemera,
      request: Hemera.Request,
      reply: Hemera.Reply,
      next: (err?: Error) => void
    ) => void
  ): Hemera
  ext(
    name: 'onServerPreHandler',
    handler: (
      instance: Hemera,
      request: Hemera.Request,
      reply: Hemera.Reply
    ) => Promise<void>
  ): Hemera

  ext(
    name: 'onServerPreRequest',
    handler: (
      instance: Hemera,
      request: Hemera.Request,
      reply: Hemera.Reply,
      next: (err?: Error) => void
    ) => void
  ): Hemera
  ext(
    name: 'onServerPreRequest',
    handler: (
      instance: Hemera,
      request: Hemera.Request,
      reply: Hemera.Reply
    ) => Promise<void>
  ): Hemera

  ext(
    name: 'onServerPreResponse',
    handler: (
      instance: Hemera,
      request: Hemera.Request,
      reply: Hemera.Reply,
      next: (err?: Error) => void
    ) => void
  ): Hemera
  ext(
    name: 'onServerPreResponse',
    handler: (
      instance: Hemera,
      request: Hemera.Request,
      reply: Hemera.Reply
    ) => Promise<void>
  ): Hemera

  // events
  on(event: 'clientPreRequest', handler: (instance: Hemera) => void): Hemera
  on(event: 'clientPostRequest', handler: (instance: Hemera) => void): Hemera
  on(event: 'serverPreHandler', handler: (instance: Hemera) => void): Hemera
  on(event: 'serverPreRequest', handler: (instance: Hemera) => void): Hemera
  on(event: 'serverPreResponse', handler: (instance: Hemera) => void): Hemera

  ready(): Promise<void>
  ready(readyListener: (err: Error) => void): void

  removeAll(): any

  // serialization
  setClientEncoder(
    encoder: (message: Object | Buffer) => Hemera.EncoderResult
  ): Hemera
  setClientDecoder(
    encoder: (message: String | Buffer) => Hemera.DecoderResult
  ): Hemera
  setServerEncoder(
    encoder: (message: Object | Buffer) => Hemera.EncoderResult
  ): Hemera
  setServerDecoder(
    encoder: (message: String | Buffer) => Hemera.DecoderResult
  ): Hemera

  setSchemaCompiler(compilerFunction: (schema: Object) => Function): Hemera
  setSchemaCompiler(compilerFunction: (schema: Object) => Promise<any>): Hemera

  setResponseSchemaCompiler(
    compilerFunction: (schema: Object) => Function
  ): Hemera
  setResponseSchemaCompiler(
    compilerFunction: (schema: Object) => Promise<any>
  ): Hemera

  setNotFoundPattern(pattern: string | Hemera.ServerPattern | null): void

  setIdGenerator(generatorFunction: () => string): Hemera
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
  request: Hemera.Request
  response: Hemera.Response

  context$: any
  meta$: any
  delegate$: any
  auth$: any
  trace$: Hemera.Trace
  request$: Hemera.Request
}
