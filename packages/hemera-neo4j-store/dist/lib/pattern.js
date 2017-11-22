"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const LabelScheme = Joi.array().items(Joi.string());
const IdentityScheme = Joi.object().keys({
    low: Joi.number(),
    high: Joi.number()
});
exports.IDScheme = Joi.alternatives().try(Joi.number(), Joi.string(), IdentityScheme);
const RelatedNodeByIdScheme = Joi.object().keys({
    id: exports.IDScheme.required()
});
const RelatedNodeByQueryScheme = Joi.object().keys({
    labels: LabelScheme,
    query: Joi.object().required()
});
exports.RelatedNodeScheme = Joi.alternatives().try(RelatedNodeByQueryScheme, RelatedNodeByIdScheme);
const SortDescriptionObjectScheme = Joi.object().keys({
    property: Joi.string().required(),
    desc: Joi.boolean().default(false)
});
const SortDescriptionArrayScheme = Joi.array().items(Joi.string(), SortDescriptionObjectScheme);
const SortDescriptionScheme = Joi.alternatives([Joi.string().required(), SortDescriptionObjectScheme.required(),
    SortDescriptionArrayScheme.required()]);
class Neo4JStorePattern {
    static create(topic) {
        return {
            topic,
            cmd: 'create',
            labels: LabelScheme,
            data: Joi.object()
        };
    }
    static remove(topic) {
        return {
            topic,
            cmd: 'remove',
            labels: LabelScheme,
            query: Joi.object()
        };
    }
    static removeById(topic) {
        return {
            topic,
            cmd: 'removeById',
            id: exports.IDScheme.required()
        };
    }
    static update(topic) {
        return {
            topic,
            cmd: 'update',
            labels: LabelScheme,
            query: Joi.object(),
            data: Joi.object().required()
        };
    }
    static updateById(topic) {
        return {
            topic,
            cmd: 'updateById',
            data: Joi.object().required(),
            id: exports.IDScheme.required()
        };
    }
    static find(topic) {
        return {
            topic,
            cmd: 'find',
            labels: LabelScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        };
    }
    static findById(topic) {
        return {
            topic,
            cmd: 'findById',
            id: exports.IDScheme.required()
        };
    }
    static replace(topic) {
        return {
            topic,
            cmd: 'replace',
            labels: LabelScheme,
            data: Joi.object().required(),
            query: Joi.object().required()
        };
    }
    static replaceById(topic) {
        return {
            topic,
            cmd: 'replaceById',
            data: Joi.object().required(),
            id: exports.IDScheme.required()
        };
    }
    static exists(topic) {
        return {
            topic,
            cmd: 'exists',
            labels: LabelScheme,
            query: Joi.object(),
            id: exports.IDScheme
        };
    }
    static createRelation(topic) {
        return {
            topic,
            cmd: 'createRelation',
            type: Joi.string().required(),
            from: exports.RelatedNodeScheme.required(),
            to: exports.RelatedNodeScheme.required(),
            data: Joi.object()
        };
    }
    static updateRelation(topic) {
        return {
            topic,
            cmd: 'updateRelation',
            type: Joi.string(),
            from: exports.RelatedNodeScheme,
            to: exports.RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false),
            query: Joi.object(),
            data: Joi.required()
        };
    }
    static updateRelationById(topic) {
        return {
            topic,
            cmd: 'updateRelationById',
            id: exports.IDScheme.required(),
            data: Joi.required()
        };
    }
    static replaceRelation(topic) {
        return {
            topic,
            cmd: 'replaceRelation',
            type: Joi.string(),
            from: exports.RelatedNodeScheme,
            to: exports.RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false),
            query: Joi.object(),
            data: Joi.required()
        };
    }
    static replaceRelationById(topic) {
        return {
            topic,
            cmd: 'replaceRelationById',
            id: exports.IDScheme.required(),
            data: Joi.required()
        };
    }
    static removeRelation(topic) {
        return {
            topic,
            cmd: 'removeRelation',
            type: Joi.string(),
            from: exports.RelatedNodeScheme,
            to: exports.RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false),
            query: Joi.object()
        };
    }
    static removeRelationById(topic) {
        return {
            topic,
            cmd: 'removeRelationById',
            id: exports.IDScheme.required()
        };
    }
    static findRelation(topic) {
        return {
            topic,
            cmd: 'findRelation',
            type: Joi.string(),
            from: exports.RelatedNodeScheme,
            to: exports.RelatedNodeScheme,
            query: Joi.object(),
            anyDirection: Joi.boolean().default(false),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        };
    }
    static findRelationById(topic) {
        return {
            topic,
            cmd: 'findRelationById',
            id: exports.IDScheme.required()
        };
    }
    static relationExists(topic) {
        return {
            topic,
            cmd: 'relationExists',
            type: Joi.string(),
            from: exports.RelatedNodeScheme,
            to: exports.RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false)
        };
    }
    static findRelationStartNodes(topic) {
        return {
            topic,
            cmd: 'findRelationStartNodes',
            type: Joi.string(),
            to: exports.RelatedNodeScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        };
    }
    static findRelationEndNodes(topic) {
        return {
            topic,
            cmd: 'findRelationEndNodes',
            type: Joi.string(),
            from: exports.RelatedNodeScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        };
    }
    static findNodesOnRelation(topic) {
        return {
            topic,
            cmd: 'findNodesOnRelation',
            type: Joi.string(),
            anyNode: exports.RelatedNodeScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        };
    }
    static executeCypherQuery(topic) {
        return {
            topic,
            cmd: 'executeCypherQuery',
            query: Joi.string().required(),
            parameters: Joi.object()
        };
    }
}
exports.Neo4JStorePattern = Neo4JStorePattern;
//# sourceMappingURL=pattern.js.map