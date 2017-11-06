//----------------------------------------------------------------------------------------------------------
import * as Neo4JLib from "neo4j-driver";
const Neo4J = Neo4JLib.v1;
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
export interface INeo4JNodeResponse
//----------------------------------------------------------------------------------------------------------
{
    identity: any;
    properties: any;
    labels: string[]
}



//----------------------------------------------------------------------------------------------------------
export interface INeo4JEntityRepresentation
//----------------------------------------------------------------------------------------------------------
{
    id: string;
    _meta: any;
    [key: string]: any;
}



//----------------------------------------------------------------------------------------------------------
export interface INeo4JNodeRepresentation extends INeo4JEntityRepresentation
//----------------------------------------------------------------------------------------------------------
{
    _meta: {
        labels: string[];
    }
}



//----------------------------------------------------------------------------------------------------------
export interface INeo4JRelationRepresentation extends INeo4JEntityRepresentation
//----------------------------------------------------------------------------------------------------------
{
    _meta: {
        type: string;
    }
}



//----------------------------------------------------------------------------------------------------------
export class Neo4JEntityModel
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    identity: { low: number, high: number } = null;
    properties: any = {};
    id: string = null;

    error: string = null;
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor(response?: any)
    //------------------------------------------------------------------------------------------------------
    {
        if ( response ) {
            this.initFromObject(response);
        }
    }


    //------------------------------------------------------------------------------------------------------
    hasError(): boolean
    //------------------------------------------------------------------------------------------------------
    {
        return this.error != null;
    }


    //------------------------------------------------------------------------------------------------------
    get( key: string): any
    //------------------------------------------------------------------------------------------------------
    {
        if (!this.properties || typeof this.properties !== 'object' ) {
            return null;
        }
        return [this.properties[key]]
    }


    //------------------------------------------------------------------------------------------------------
    toObject(): INeo4JEntityRepresentation
    //------------------------------------------------------------------------------------------------------
    {
        let representation: INeo4JEntityRepresentation = {
            id: this.id,
            _meta: {}
        };

        if ( this.properties && typeof this.properties === 'object' ) {

            Object.keys(this.properties).forEach(key => {
                representation[key] = this.properties[key];
            });
        }

        return representation;
    }


    //------------------------------------------------------------------------------------------------------
    initFromObject(object: any): Neo4JEntityModel
    //------------------------------------------------------------------------------------------------------
    {
        if ( !object || typeof object !== 'object' || Array.isArray(object) ) {
            this.error = 'Cannot init Neo4JNodeModel with: ' + JSON.stringify(object);
            console.log(this.error);
            return this;
        }

        this.identity = object.identity || this.identity;
        this.properties = object.properties || this.properties || {};

        // if identity is a integer in neo4j database (given as decimal)
        if ( object.identity && Neo4J.isInt(object.identity) ) {
            this.id = Neo4J.integer.toString(object.identity); // make number a string to allow (2^53) numbers
        }

        if ( !object.properties || typeof object.properties !== 'object' ) {
            Object.keys(object).forEach(key => {
                this.properties[key] = object[key];
            });
        }

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    static fromObject(object: any): Neo4JEntityModel
    //------------------------------------------------------------------------------------------------------
    {
        return new this(object);
    }


    //------------------------------------------------------------------------------------------------------
    static fromArray(objects: any[]): Neo4JEntityModel[]
    //------------------------------------------------------------------------------------------------------
    {
        let result = [], i , current, model;

        for (i = 0; i < objects.length; i++ ) {
            current = objects[i];

            model = this.fromObject(current);

            if (model) {
                result.push(model);
            }
        }

        return result;
    }
}


//----------------------------------------------------------------------------------------------------------
export class Neo4JNodeModel extends Neo4JEntityModel
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    labels: string[];
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor(response?: any, labels?: string | string[])
    //------------------------------------------------------------------------------------------------------
    {
        super(response);

        if ( labels ) {
            this.setLabels(labels);
        } else if (!this.labels || this.labels.length < 1 ) {
            this.setLabels(['UNKNOWN']);
        }
    }


    //------------------------------------------------------------------------------------------------------
    setLabels(labels: string | string[]): Neo4JEntityModel
    //------------------------------------------------------------------------------------------------------
    {
        if (typeof labels === "string" ) {
            if ( labels.length < 1 ) {
                return this;
            }
            return this.setLabels([labels]);
        }

        if ( Array.isArray(labels) && labels.length ) {
            this.labels = labels;
        }

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    addLabel(label: string): Neo4JEntityModel
    //------------------------------------------------------------------------------------------------------
    {
        if (typeof label === "string" && label.length > 0 ) {
            this.labels.push(label);
        }

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    removeLabel(label: string): Neo4JEntityModel
    //------------------------------------------------------------------------------------------------------
    {
        let index = -1;
        if (typeof label === "string" && label.length > 0 ) {
            index = this.labels.indexOf(label);
            if ( index > -1 ) {
                this.labels.splice(index, 1);
            }
        }

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    static fromObject(object: any, labels?: string | string[]): Neo4JNodeModel
    //------------------------------------------------------------------------------------------------------
    {
        return new this(object, labels);
    }


    //------------------------------------------------------------------------------------------------------
    static fromArray(objects: any[], labels?: string | string[]): Neo4JNodeModel[]
    //------------------------------------------------------------------------------------------------------
    {
        let result = [], i , current, model;

        for (i = 0; i < objects.length; i++ ) {
            current = objects[i];

            model = this.fromObject(current, labels);

            if (model) {
                result.push(model);
            }
        }

        return result;
    }


    //------------------------------------------------------------------------------------------------------
    toObject(): INeo4JNodeRepresentation
    //------------------------------------------------------------------------------------------------------
    {
        let representation = super.toObject();

        representation._meta.labels = this.labels;

        return <INeo4JNodeRepresentation>representation;
    }


    //------------------------------------------------------------------------------------------------------
    initFromObject(object: any): Neo4JNodeModel
    //------------------------------------------------------------------------------------------------------
    {
        super.initFromObject(object);

        if ( this.hasError() ) {
            return this;
        }

        // labels
        this.labels = object.labels || this.labels;

        // labels
        if ( object._meta && typeof object._meta === 'object' ) {
            if ( object._meta.labels ) {
                this.setLabels(object._meta.labels);
            }
        }

        return this;
    }
}


//----------------------------------------------------------------------------------------------------------
export class Neo4JRelationModel extends Neo4JEntityModel
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    type: string;
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    constructor(response?: any, type?: string)
    //------------------------------------------------------------------------------------------------------
    {
        super(response);

        if ( type ) {
            this.type = type;
        } else if ( !this.type || this.type.length < 1 ) {
            this.type = 'UNKNOWN'
        }
    }


    //------------------------------------------------------------------------------------------------------
    static fromObject(object: any, type?: string): Neo4JRelationModel
    //------------------------------------------------------------------------------------------------------
    {
        return new this(object, type);
    }


    //------------------------------------------------------------------------------------------------------
    static fromArray(objects: any[], type?: string): Neo4JRelationModel[]
    //------------------------------------------------------------------------------------------------------
    {
        let result = [], i , current, model;

        for (i = 0; i < objects.length; i++ ) {
            current = objects[i];

            model = this.fromObject(current, type);

            if (model) {
                result.push(model);
            }
        }

        return result;
    }


    //------------------------------------------------------------------------------------------------------
    toObject(): INeo4JRelationRepresentation
    //------------------------------------------------------------------------------------------------------
    {
        let representation = super.toObject();

        representation._meta.type = this.type;

        return <INeo4JRelationRepresentation>representation;
    }


    //------------------------------------------------------------------------------------------------------
    initFromObject(object: any): Neo4JRelationModel
    //------------------------------------------------------------------------------------------------------
    {
        super.initFromObject(object);

        if ( this.hasError() ) {
            return this;
        }

        if ( typeof object.type === 'string' && object.type.length > 0 ) {
            this.type = object.type || this.type;
        }

        return this;
    }

}