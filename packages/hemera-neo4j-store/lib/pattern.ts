//----------------------------------------------------------------------------------------------------------
import * as Joi from 'joi';
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
const LabelScheme = Joi.array().items(Joi.string());
const IdentityScheme = Joi.object().keys({
    low: Joi.number(),
    high: Joi.number()
});
export const IDScheme = Joi.alternatives().try(Joi.number(), Joi.string(), IdentityScheme);

const RelatedNodeByIdScheme = Joi.object().keys({
    id: IDScheme.required()
});

const RelatedNodeByQueryScheme = Joi.object().keys({
    labels: LabelScheme,
    query: Joi.object().required()
});

export const RelatedNodeScheme = Joi.alternatives().try(
    RelatedNodeByQueryScheme,
    RelatedNodeByIdScheme
);

const SortDescriptionObjectScheme = Joi.object().keys({
    property: Joi.string().required(),
    desc: Joi.boolean().default(false)
});
const SortDescriptionArrayScheme = Joi.array().items(Joi.string(), SortDescriptionObjectScheme);
const SortDescriptionScheme =
    Joi.alternatives([Joi.string().required(), SortDescriptionObjectScheme.required(),
        SortDescriptionArrayScheme.required()]);
//----------------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------------
/**
 *
 *
 * @class StorePattern
 */
export class Neo4JStorePattern
//----------------------------------------------------------------------------------------------------------
{
    /////////////////////// NODES //////////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static create(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'create',
            labels: LabelScheme,
            data: Joi.object()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static remove(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'remove',
            labels: LabelScheme,
            query: Joi.object()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static removeById(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'removeById',
            id: IDScheme.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static update(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'update',
            labels: LabelScheme,
            query: Joi.object(),
            data: Joi.object().required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static updateById(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'updateById',
            data: Joi.object().required(),
            id: IDScheme.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static find(topic)
    //------------------------------------------------------------------------------------------------------
    {
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
        }
    }

    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static findById(topic) {
        return {
            topic,
            cmd: 'findById',
            id: IDScheme.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static replace(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'replace',
            labels: LabelScheme,
            data: Joi.object().required(),
            query: Joi.object().required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static replaceById(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'replaceById',
            data: Joi.object().required(),
            id: IDScheme.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static exists(topic)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'exists',
            labels: LabelScheme,
            query: Joi.object(),
            id: IDScheme
        }
    }


    /////////////////////// RELATIONS //////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static createRelation(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'createRelation',
            type: Joi.string().required(),
            from: RelatedNodeScheme.required(),
            to: RelatedNodeScheme.required(),
            data: Joi.object()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static updateRelation(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'updateRelation',
            type: Joi.string(),
            from: RelatedNodeScheme,
            to: RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false),
            query: Joi.object(), // relation data to query for
            data: Joi.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static updateRelationById(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'updateRelationById',
            id: IDScheme.required(),
            data: Joi.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static replaceRelation(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'replaceRelation',
            type: Joi.string(),
            from: RelatedNodeScheme,
            to: RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false),
            query: Joi.object(), // relation data to query for
            data: Joi.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static replaceRelationById(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'replaceRelationById',
            id: IDScheme.required(),
            data: Joi.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static removeRelation(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'removeRelation',
            type: Joi.string(),
            from: RelatedNodeScheme,
            to: RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false),
            query: Joi.object() // relation data
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static removeRelationById(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'removeRelationById',
            id: IDScheme.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static findRelation(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'findRelation',
            type: Joi.string(),
            from: RelatedNodeScheme,
            to: RelatedNodeScheme,
            query: Joi.object(),
            anyDirection: Joi.boolean().default(false),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static findRelationById(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'findRelationById',
            id: IDScheme.required()
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static relationExists(topic: any) // FIXME: test
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'relationExists',
            type: Joi.string(),
            from: RelatedNodeScheme,
            to: RelatedNodeScheme,
            anyDirection: Joi.boolean().default(false)
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static findRelationStartNodes(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'findRelationStartNodes',
            type: Joi.string(),
            to: RelatedNodeScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static findRelationEndNodes(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'findRelationEndNodes',
            type: Joi.string(),
            from: RelatedNodeScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static findNodesOnRelation(topic: any)
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'findNodesOnRelation',
            type: Joi.string(),
            anyNode: RelatedNodeScheme,
            query: Joi.object(),
            options: Joi.object().keys({
                orderBy: SortDescriptionScheme,
                offset: Joi.number().integer(),
                limit: Joi.number().integer()
            }).default({})
        }
    }


    //------------------------------------------------------------------------------------------------------
    /**
     *
     *
     * @static
     * @param {any} topic
     * @returns
     *
     * @memberOf StorePattern
     */
    static executeCypherQuery(topic: any) // TODO: exclusive tests
    //------------------------------------------------------------------------------------------------------
    {
        return {
            topic,
            cmd: 'executeCypherQuery',
            query: Joi.string().required(),
            parameters: Joi.object()
        }
    }


    // TODO: transactions
}
