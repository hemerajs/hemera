import * as Hp from 'hemera-plugin';
import * as Neo4JLib from "neo4j-driver";
const Neo4J = Neo4JLib.v1;
import {Neo4JStore} from "./store";
import {Neo4JStorePattern} from "./pattern";
import {Neo4JNodeModel, Neo4JRelationModel} from "./model";
const integer = require("neo4j-driver/lib/v1/integer");

export const HemeraNeo4JStore: any = {};

HemeraNeo4JStore.plugin = Hp(function hemeraNeo4JStore (hemera, options, done) {
    //const hemera = this;
    const topic = 'neo4j-store';

    const CNeo4jDriver =
        Neo4J.driver(
            options.neo4j.url,
            Neo4J.auth.basic(options.neo4j.user, options.neo4j.password));

    console.log(options);

    hemera.decorate('neo4j', Neo4JStore);
    hemera.decorate('neo4j-node-model', Neo4JNodeModel);
    hemera.decorate('neo4j-rel-model', Neo4JRelationModel);
    hemera.decorate('neo4j-integer', integer);

    hemera.add(Neo4JStorePattern.create(topic), function (req, cb) {

        const store = new Neo4JStore(CNeo4jDriver);
        store.create(req, cb);
    });

    hemera.add(Neo4JStorePattern.update(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.update(req, cb);
    });

    hemera.add(Neo4JStorePattern.updateById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.updateById(req, cb);
    });

    hemera.add(Neo4JStorePattern.remove(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.remove(req, cb);
    });

    hemera.add(Neo4JStorePattern.removeById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.removeById(req, cb);
    });

    hemera.add(Neo4JStorePattern.replace(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.replace(req, cb);
    });

    hemera.add(Neo4JStorePattern.replaceById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.replaceById(req, cb);
    });

    hemera.add(Neo4JStorePattern.findById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.findById(req, cb);
    });

    hemera.add(Neo4JStorePattern.find(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.find(req, cb);
    });

    hemera.add(Neo4JStorePattern.exists(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.exists(req, cb);
    });


    hemera.add(Neo4JStorePattern.createRelation(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.createRelation(req, cb);
    });


    hemera.add(Neo4JStorePattern.updateRelation(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.updateRelation(req, cb);
    });


    hemera.add(Neo4JStorePattern.updateRelationById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.updateRelationById(req, cb);
    });


    hemera.add(Neo4JStorePattern.replaceRelation(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.replaceRelation(req, cb);
    });


    hemera.add(Neo4JStorePattern.replaceRelationById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.replaceRelationById(req, cb);
    });


    hemera.add(Neo4JStorePattern.removeRelation(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.removeRelation(req, cb);
    });


    hemera.add(Neo4JStorePattern.removeRelationById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.removeRelationById(req, cb);
    });


    hemera.add(Neo4JStorePattern.findRelation(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.findRelation(req, cb);
    });


    hemera.add(Neo4JStorePattern.findRelationById(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.findRelationById(req, cb);
    });


    hemera.add(Neo4JStorePattern.findRelationStartNodes(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.findRelationStartNodes(req, cb);
    });


    hemera.add(Neo4JStorePattern.findRelationEndNodes(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.findRelationEndNodes(req, cb);
    });


    hemera.add(Neo4JStorePattern.findNodesOnRelation(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.findNodesOnRelation(req, cb);
    });


    hemera.add(Neo4JStorePattern.relationExists(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.relationExists(req, cb);
    });


    hemera.add(Neo4JStorePattern.executeCypherQuery(topic), function (req, cb) {
        const store = new Neo4JStore(CNeo4jDriver);

        store.executeCypherQuery(req, cb);
    });

    done();
}, '>=2.0.0');

HemeraNeo4JStore.options = {
    name: require("../../package.json").name,
    payloadValidator: 'hemera-joi'
};

HemeraNeo4JStore.attributes = {
    pkg: require('../../package.json')
};
