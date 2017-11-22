export declare const IDScheme: any;
export declare const RelatedNodeScheme: any;
export declare class Neo4JStorePattern {
    static create(topic: any): {
        topic: any;
        cmd: string;
        labels: any;
        data: any;
    };
    static remove(topic: any): {
        topic: any;
        cmd: string;
        labels: any;
        query: any;
    };
    static removeById(topic: any): {
        topic: any;
        cmd: string;
        id: any;
    };
    static update(topic: any): {
        topic: any;
        cmd: string;
        labels: any;
        query: any;
        data: any;
    };
    static updateById(topic: any): {
        topic: any;
        cmd: string;
        data: any;
        id: any;
    };
    static find(topic: any): {
        topic: any;
        cmd: string;
        labels: any;
        query: any;
        options: any;
    };
    static findById(topic: any): {
        topic: any;
        cmd: string;
        id: any;
    };
    static replace(topic: any): {
        topic: any;
        cmd: string;
        labels: any;
        data: any;
        query: any;
    };
    static replaceById(topic: any): {
        topic: any;
        cmd: string;
        data: any;
        id: any;
    };
    static exists(topic: any): {
        topic: any;
        cmd: string;
        labels: any;
        query: any;
        id: any;
    };
    static createRelation(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        to: any;
        data: any;
    };
    static updateRelation(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        to: any;
        anyDirection: any;
        query: any;
        data: any;
    };
    static updateRelationById(topic: any): {
        topic: any;
        cmd: string;
        id: any;
        data: any;
    };
    static replaceRelation(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        to: any;
        anyDirection: any;
        query: any;
        data: any;
    };
    static replaceRelationById(topic: any): {
        topic: any;
        cmd: string;
        id: any;
        data: any;
    };
    static removeRelation(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        to: any;
        anyDirection: any;
        query: any;
    };
    static removeRelationById(topic: any): {
        topic: any;
        cmd: string;
        id: any;
    };
    static findRelation(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        to: any;
        query: any;
        anyDirection: any;
        options: any;
    };
    static findRelationById(topic: any): {
        topic: any;
        cmd: string;
        id: any;
    };
    static relationExists(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        to: any;
        anyDirection: any;
    };
    static findRelationStartNodes(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        to: any;
        query: any;
        options: any;
    };
    static findRelationEndNodes(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        from: any;
        query: any;
        options: any;
    };
    static findNodesOnRelation(topic: any): {
        topic: any;
        cmd: string;
        type: any;
        anyNode: any;
        query: any;
        options: any;
    };
    static executeCypherQuery(topic: any): {
        topic: any;
        cmd: string;
        query: any;
        parameters: any;
    };
}
