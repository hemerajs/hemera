declare type Config = {
  timeout: number;
  crashOnFatal: boolean;
  logLevel: string;
  logger?: any;
  load?: any;
}

type PluginDefinition = {
  attributes: { name: string, dependencies: Array<string> };
  plugin: Function;
  options: any;
}

type Response = Error | any;

type Request = {
  duration: number;
  parentId: string;
  timestamp: number;
  id: string;
  type: string;
  method?: string;
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
  parentSpanId?: string;
  traceId?: string;
  spanId?: string;
  service?: string;
  duration?: number;
  timestamp?: number;
  method?: string;
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
	queue?: string,
	max?: number
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
	publish(subject: string, msg?: string | Buffer, reply?: string, callback?: Function): void;

  request(subject: string, callback: Function): number;
	request(subject: string, msg: string | Buffer, callback: Function): number;
	request(subject: string, msg?: string, options?: SubscribeOptions, callback?: Function): number;

  close(): void;

}