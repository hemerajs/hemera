declare type Config = {
  timeout: number;
  crashOnFatal: boolean;
  logLevel: string;
  logger?: any;
  name: string;
  load? : LoadConfig;
}

declare type LoadConfig = {
  sampleInterval?: number;
}

type PluginDefinition = {
  attributes: {
    name: string,
    dependencies: Array < string >
  };
  plugin: Function;
  options: any;
}

declare class Ext {
  _handler: Array < Function > ;
  _type: string;

  add(handler: Function): void;
  addRange(handlers: Array<Function>): void;
}

declare class Hemera {
  context$: Context;
  meta$: Meta;
  delegate$: Delegate;
  plugin$: Plugin;
  trace$: Trace;
  request$: Request;

  log: any;

  _config: Config;
  _catalog: any;
  _heavy: any;
  _transport: Nats;
  _topics: {
    [id: string]: boolean
  };
  _plugins: {
    [id: string]: Plugin
  };

  _exposition: any;
  _extensions: {
    [id: string]: Ext
  };
  _shouldCrash: boolean;
  _replyTo: string;
  _request: any;
  _response: any;
  _pattern: any;
  _actMeta: any;
  _prevContext: Hemera;
  _cleanPattern: any;
  _message: any;

  _encoder: Encoder;
  _decoder: Decoder;

  emit(a: string, b: any): void;
}

type Response = Error | any;

type Request = {
  duration: number;
  parentId: string;
  timestamp: number;
  id: string;
  type: string;
  method ? : string;
};

type Meta = {
  [x: string]: any,
};

type Context = {
  [x: string]: any,
};

type Plugin = {
  [x: string]: any
};

type Exposition = {
  [x: string]: any,
};

type Delegate = {
  [x: string]: any,
};

type Trace = {
  parentSpanId ? : string;
  traceId ? : string;
  spanId ? : string;
  service ? : string;
  duration ? : number;
  timestamp ? : number;
  method ? : string;
};

interface Encoder {
  encode(): any;
};

interface Decoder {
  decode(): any;
};

type Pattern = {
  meta$: any;
  trace$: Trace;
  topic: string;
  context$: any;
  requestId$: string;
  pubsub$: boolean;
  delegate$: any;
}

type Message = {
  meta: Meta;
  trace: Trace;
  request: Request;
  result: any;
  error: Error | null;
}

type ActMessage = {
  pattern: any;
  meta: any;
  delegate: any;
  trace: any;
  request: Request;
}

type ActResponse = any;

type ActMeta = {
  schema: any;
  pattern: any;
  action: function;
}

// https://github.com/nats-io/node-nats/blob/master/index.d.ts

interface SubscribeOptions {
  queue ? : string,
    max ? : number
}

declare class Nats {

  createInbox(): string;

  subscribe(subject: string, callback: Function): number;
  subscribe(subject: string, opts: SubscribeOptions, callback: Function): number;
  on(a: string, b: Function): void;
  timeout(sid: number, timeout: number, expected: number, callback: function): void;

  publish(callback: Function): void;
  publish(subject: string, callback: Function): void;
  publish(subject: string, msg: string | Buffer, callback: Function): void;
  publish(subject: string, msg ? : string | Buffer, reply ? : string, callback ? : Function): void;

  request(subject: string, callback: Function): number;
  request(subject: string, msg: string | Buffer, callback: Function): number;
  request(subject: string, msg ? : string, options ? : SubscribeOptions, callback ? : Function): number;

  close(): void;

}