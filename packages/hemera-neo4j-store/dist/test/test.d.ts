import { Neo4JNodeModel, Neo4JRelationModel } from "../lib/model";
export interface NodeAssertions {
    labels?: string[];
    properties?: {
        [key: string]: any;
    };
    updatedProperties?: {
        [key: string]: any;
    };
    id?: string;
}
export interface RelationAssertions {
    type?: string;
    properties?: {
        [key: string]: any;
    };
    updatedProperties?: {
        [key: string]: any;
    };
    id?: string;
}
export declare class AssertionHelper {
    static checkNode(node: Neo4JNodeModel, options?: NodeAssertions): void;
    static checkNodeArray(nodes: Neo4JNodeModel[], assertions?: NodeAssertions[]): void;
    static checkRelation(relation: Neo4JRelationModel, options?: RelationAssertions): void;
    static checkRelationArray(relations: Neo4JRelationModel[], assertions?: RelationAssertions[]): void;
}
