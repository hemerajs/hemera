"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Neo4JLib = require("neo4j-driver");
const Neo4J = Neo4JLib.v1;
class Neo4JEntityModel {
    constructor(response) {
        this.identity = null;
        this.properties = {};
        this.id = null;
        this.error = null;
        if (response) {
            this.initFromObject(response);
        }
    }
    hasError() {
        return this.error != null;
    }
    get(key) {
        if (!this.properties || typeof this.properties !== 'object') {
            return null;
        }
        return [this.properties[key]];
    }
    toObject() {
        let representation = {
            id: this.id,
            _meta: {}
        };
        if (this.properties && typeof this.properties === 'object') {
            Object.keys(this.properties).forEach(key => {
                representation[key] = this.properties[key];
            });
        }
        return representation;
    }
    initFromObject(object) {
        if (!object || typeof object !== 'object' || Array.isArray(object)) {
            this.error = 'Cannot init Neo4JNodeModel with: ' + JSON.stringify(object);
            console.log(this.error);
            return this;
        }
        this.identity = object.identity || this.identity;
        this.properties = object.properties || this.properties || {};
        if (object.identity && Neo4J.isInt(object.identity)) {
            this.id = Neo4J.integer.toString(object.identity);
        }
        if (!object.properties || typeof object.properties !== 'object') {
            Object.keys(object).forEach(key => {
                this.properties[key] = object[key];
            });
        }
        return this;
    }
    static fromObject(object) {
        return new this(object);
    }
    static fromArray(objects) {
        let result = [], i, current, model;
        for (i = 0; i < objects.length; i++) {
            current = objects[i];
            model = this.fromObject(current);
            if (model) {
                result.push(model);
            }
        }
        return result;
    }
}
exports.Neo4JEntityModel = Neo4JEntityModel;
class Neo4JNodeModel extends Neo4JEntityModel {
    constructor(response, labels) {
        super(response);
        if (labels) {
            this.setLabels(labels);
        }
        else if (!this.labels || this.labels.length < 1) {
            this.setLabels(['UNKNOWN']);
        }
    }
    setLabels(labels) {
        if (typeof labels === "string") {
            if (labels.length < 1) {
                return this;
            }
            return this.setLabels([labels]);
        }
        if (Array.isArray(labels) && labels.length) {
            this.labels = labels;
        }
        return this;
    }
    addLabel(label) {
        if (typeof label === "string" && label.length > 0) {
            this.labels.push(label);
        }
        return this;
    }
    removeLabel(label) {
        let index = -1;
        if (typeof label === "string" && label.length > 0) {
            index = this.labels.indexOf(label);
            if (index > -1) {
                this.labels.splice(index, 1);
            }
        }
        return this;
    }
    static fromObject(object, labels) {
        return new this(object, labels);
    }
    static fromArray(objects, labels) {
        let result = [], i, current, model;
        for (i = 0; i < objects.length; i++) {
            current = objects[i];
            model = this.fromObject(current, labels);
            if (model) {
                result.push(model);
            }
        }
        return result;
    }
    toObject() {
        let representation = super.toObject();
        representation._meta.labels = this.labels;
        return representation;
    }
    initFromObject(object) {
        super.initFromObject(object);
        if (this.hasError()) {
            return this;
        }
        this.labels = object.labels || this.labels;
        if (object._meta && typeof object._meta === 'object') {
            if (object._meta.labels) {
                this.setLabels(object._meta.labels);
            }
        }
        return this;
    }
}
exports.Neo4JNodeModel = Neo4JNodeModel;
class Neo4JRelationModel extends Neo4JEntityModel {
    constructor(response, type) {
        super(response);
        if (type) {
            this.type = type;
        }
        else if (!this.type || this.type.length < 1) {
            this.type = 'UNKNOWN';
        }
    }
    static fromObject(object, type) {
        return new this(object, type);
    }
    static fromArray(objects, type) {
        let result = [], i, current, model;
        for (i = 0; i < objects.length; i++) {
            current = objects[i];
            model = this.fromObject(current, type);
            if (model) {
                result.push(model);
            }
        }
        return result;
    }
    toObject() {
        let representation = super.toObject();
        representation._meta.type = this.type;
        return representation;
    }
    initFromObject(object) {
        super.initFromObject(object);
        if (this.hasError()) {
            return this;
        }
        if (typeof object.type === 'string' && object.type.length > 0) {
            this.type = object.type || this.type;
        }
        return this;
    }
}
exports.Neo4JRelationModel = Neo4JRelationModel;
//# sourceMappingURL=model.js.map