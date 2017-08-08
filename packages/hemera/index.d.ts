// Type definitions for Hemera v1.5.0
// Project: https://github.com/hemerajs/hemera
// Definitions by: Dustin Deus <https://github.com/starptech>

import events = require('events');

declare type Buffer = any;

declare interface Pattern {
  topic: string;
  [key: string]: any;
}

// @TODO use typings
/*declare interface Promise {
  then(onFulfilled? : (value: any) => any) : Promise;
  catch(onRejected? : (error: Error) => any) : Promise;
}*/

declare interface PluginDefinitionAttributes {
  name: string;
  description: string;
  version: string;
}

declare interface PluginDefinition {
  register: Function;
  attributes: PluginDefinitionAttributes;
  options: any;
  parentPluginName: string;
}

declare interface Router {
}

declare interface Load {
}

declare interface CodecPipeline {
  add(step: Function): CodecPipeline;
  reset(step: Function): CodecPipeline;
  unshift(step: Function): CodecPipeline;
  run(msg: string | Buffer, cb: Function): string | Buffer;
}

declare interface ServerRequest {
  payload: any;
  error: any;
  locals: any;
}

declare interface ServerResponse {
  payload: any;
  error: any;
}

declare interface ClientRequest {
  payload: any;
  error: any;
}

declare interface ClientResponse {
  payload: any;
  error: any;
}

declare interface Reply {
  payload: any;
  error: any;
  send(data: Error | any);
  end(data: Error | any);
  [key: string]: any;
}

declare type RequestType =
  'pubsub' |
  'request'

declare interface Trace {
  traceId: string;
  parentSpanId: string;
  spanId: string;
  timestamp: number;
  service: string;
  method: string;
  duration: number;
}

declare interface Request {
  id: string;
  type: RequestType;
}

declare interface Delegate {
}

declare interface Meta {
}

declare type LogLevel =
  'fatal' |
  'error' |
  'warn' |
  'info' |
  'debug' |
  'trace' |
  'silent'

declare interface ErrioConfig {
  recursive?: boolean;
  inherited?: boolean;
  stack?: boolean;
  private?: boolean;
  exclude?: Array<string>;
  include?: Array<string>;
}

declare interface BloomrunConfig {
  indexing: 'insertion' | 'depth';
  lookupBeforeAdd: boolean;
}

declare interface LoadConfig {
  checkPolicy?: boolean;
  shouldCrash?: boolean;
  process?: LoadProcessConfig;
  policy?: LoadPolicyConfig;
}

declare interface LoadProcessConfig {
  sampleInterval?: number;
}

declare interface LoadPolicyConfig {
  maxHeapUsedBytes?: number;
  maxRssBytes?: number;
  maxEventLoopDelay?: number;
}

declare interface CircuitBreakerConfig {
  enabled?: boolean;
  minSuccesses?: number;
  halfOpenTime?: number;
  resetIntervalTime?: number;
  maxFailures?: number;
}

declare interface Config {
  timeout?: number;
  pluginTimeout?: number;
  tag?: string;
  prettyLog?: boolean;
  name?: string;
  crashOnFatal?: boolean;
  logLevel?: LogLevel;
  childLogger?: boolean;
  maxRecursion?: number;
  logger?: any;
  errio?: ErrioConfig;
  bloomrun?: BloomrunConfig;
  load?: LoadConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

declare type HemeraEvents =
  'error' |
  'clientPreRequest' |
  'clientPostRequest' |
  'serverPreHandler' |
  'serverPreRequest' |
  'serverPreResponse'

declare type ExtensionType =
  'onClientPreRequest' |
  'onClientPostRequest' |
  'onServerPreHandler' |
  'onServerPreRequest' |
  'onServerPreResponse'

declare type AddMetaMiddleware = (request: ServerRequest, response: ServerResponse, next: Function) => void;

declare interface AddMeta {
  schema: any;
  pattern: Pattern;
  action: Function;
  plugin: PluginDefinition;
  use(handler: AddMetaMiddleware): AddMeta;
  end(cb: Function): void;
}

declare type ClientResult = any;

declare type AddHandler = (this: Hemera, request: Pattern, reply?: any) => void;
declare type ActHandler = (this: Hemera, error: Error, response: ClientResult) => void;

declare type ExtensionNextHandler = (error: Error) => void;
declare type ExtensionHandler = (ctx: Hemera, request: any, response: any, next?: ExtensionNextHandler) => void;

interface Plugins {
  [name: string]: PluginDefinition;
}

declare class Hemera extends events.EventEmitter {
  constructor(transport: object, config: Config);

  ready(callback: Function): void;
  act(pattern: string | Pattern, handler?: ActHandler): Promise<any>;
  add(pattern: string | Pattern, handler: AddHandler): AddMeta;
  use(params: PluginDefinition, options?: any): void;
  createError(name: string): any;
  decorate(prop: string, value: any): void;
  remove(topic: string, maxMessages: number): boolean;
  list(Pattern, options: any): any;
  close(callback?: Function): void;
  fatal(): void;
  expose(key: string, object: any): void;
  ext(type: ExtensionType, handler: ExtensionHandler): void;
  setConfig(key: string, value: any): void;
  setOption(key: string, value: any): void;
  on(event: HemeraEvents, handler: Function);
  removeAll();

  encoder: CodecPipeline;
  decoder: CodecPipeline;

  plugins: Plugins;
  router: Router;
  load: Load;
  exposition: any;
  errors: any;
  config: any;
  topics: any;
  transport: any;

  context$: any;
  meta$: Meta;
  delegate$: Delegate;
  auth$: any;
  plugin$: PluginDefinition;
  trace$: Trace;
  request$: Request;
}

export = Hemera
