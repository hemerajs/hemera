import events = require('events');

export interface Pattern {
  topic: string;
}

export interface PluginRegistration {
}
export interface PluginDefinitionAttributes {
  name: string;
  description: string;
  version: string;
  dependencies: string | Array<string>;
}
export interface PluginDefinition {
  attributes: PluginDefinitionAttributes;
  options: any;
}
export interface Router {
}
export interface Load {
}
export interface AddMeta {
  schema: any;
  pattern: Pattern;
  action: Function;
  plugin: PluginRegistration;
  use(handler: Function): AddMeta
  end(cb: Function): void;
}

declare class Hemera extends events.EventEmitter {
  constructor(transport:object, params:object);

	ready(callback: Function): void;
  act(pattern: string | Pattern, callback: Function): void;
  add(pattern: string | Pattern, callback: Function): AddMeta;
  use(params: PluginDefinition, options?: any): void;
  createError(name: string, customConstructor: function): any;
  decorate(prop: string, value: any): void;
  remove(topic: string, maxMessages: number): boolean;
  list(Pattern, options: any): any;
  close(): void;
  fatal(): void;
  expose(key: string, object: any): void;
  ext(type: string, handler: Function): void;
  setConfig(key: string, value: any): void;
  setOption(key: string, value: any): void;

  plugins: Array<PluginRegistration>;
  router: Router;
  load: Load;
  exposition: any;
  errors: any;
  config: any;
  topics: any;
  transport: any;

  context$: any;
  meta$: any;
  delegate$: any;
  auth$: any;
  plugin$: PluginDefinition;
  trace$: any;
  request$: any;

  _shouldCrash: boolean;
  _topic: string;
  _replyTo: string;
  _request: any;
  _response: any;
  _pattern: Pattern;
  _actMeta: any;
  _actCallback: Function;
  _cleanPattern: Pattern;
  _root: Hemera;
  _encoder: any;
  _decoder: any;
  _extensions: Map<string, any>;

}
