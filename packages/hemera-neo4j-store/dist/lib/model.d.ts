export interface INeo4JNodeResponse {
    identity: any;
    properties: any;
    labels: string[];
}
export interface INeo4JEntityRepresentation {
    id: string;
    _meta: any;
    [key: string]: any;
}
export interface INeo4JNodeRepresentation extends INeo4JEntityRepresentation {
    _meta: {
        labels: string[];
    };
}
export interface INeo4JRelationRepresentation extends INeo4JEntityRepresentation {
    _meta: {
        type: string;
    };
}
export declare class Neo4JEntityModel {
    identity: {
        low: number;
        high: number;
    };
    properties: any;
    id: string;
    error: string;
    constructor(response?: any);
    hasError(): boolean;
    get(key: string): any;
    toObject(): INeo4JEntityRepresentation;
    initFromObject(object: any): Neo4JEntityModel;
    static fromObject(object: any): Neo4JEntityModel;
    static fromArray(objects: any[]): Neo4JEntityModel[];
}
export declare class Neo4JNodeModel extends Neo4JEntityModel {
    labels: string[];
    constructor(response?: any, labels?: string | string[]);
    setLabels(labels: string | string[]): Neo4JEntityModel;
    addLabel(label: string): Neo4JEntityModel;
    removeLabel(label: string): Neo4JEntityModel;
    static fromObject(object: any, labels?: string | string[]): Neo4JNodeModel;
    static fromArray(objects: any[], labels?: string | string[]): Neo4JNodeModel[];
    toObject(): INeo4JNodeRepresentation;
    initFromObject(object: any): Neo4JNodeModel;
}
export declare class Neo4JRelationModel extends Neo4JEntityModel {
    type: string;
    constructor(response?: any, type?: string);
    static fromObject(object: any, type?: string): Neo4JRelationModel;
    static fromArray(objects: any[], type?: string): Neo4JRelationModel[];
    toObject(): INeo4JRelationRepresentation;
    initFromObject(object: any): Neo4JRelationModel;
}
