"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_typescript_1 = require("mocha-typescript");
const Neo4JLib = require("neo4j-driver");
const index_1 = require("../lib/index");
const Hemera = require("nats-hemera");
const NATS = require("nats");
const HemeraJoi = require("hemera-joi");
const Code = require("code");
const _ = require("lodash");
const Neo4J = Neo4JLib.v1;
const expect = Code.expect;
function wrapAssertions(assertions, done) {
    try {
        assertions();
        done();
    }
    catch (err) {
        done(err);
    }
}
class TestHelper {
    static createTestNode(node) {
        return Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: node.labels,
            data: node.data
        });
    }
    static createTestNodes(nodes) {
        let promises = [];
        nodes.forEach(node => {
            promises.push(this.createTestNode(node));
        });
        return Promise.all(promises);
    }
    static createTestRel(rel) {
        return Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            from: rel.from,
            to: rel.to,
            type: rel.type,
            data: rel.data
        });
    }
    static createTestRels(rels) {
        let promises = [];
        rels.forEach(rel => {
            promises.push(this.createTestRel(rel));
        });
        return Promise.all(promises);
    }
    static cleanupData() {
        return Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'executeCypherQuery',
            query: `MATCH (n:Test) OPTIONAL MATCH (n)-[r]-() DELETE r,n`
        }).then(() => {
            return Promise.resolve();
        });
    }
    static createRelationsToBeUpdated() {
        let numOfNodes, numOfRels = 5, i;
        let nodes = [], labels;
        let relations = [];
        numOfNodes = numOfRels * 2;
        for (i = 0; i < numOfNodes; i++) {
            labels = ['Test', 'Additional', 'TestStart'];
            if (i % 2) {
                labels = ['Test', 'Additional', 'TestEnd'];
            }
            nodes.push({
                labels: ['Test', 'Additional'],
                data: {
                    name: 'Some node ' + (i + 1), description: "i am a node", additional: true
                }
            });
        }
        return this.createTestNodes(nodes)
            .then(_nodes => {
            let fromIndex, toIndex;
            for (i = 0; i < numOfRels; i++) {
                fromIndex = i * 2;
                toIndex = fromIndex + 1;
                relations.push({
                    type: 'testRelation',
                    from: {
                        id: _nodes[fromIndex].id
                    },
                    to: {
                        id: _nodes[toIndex].id
                    },
                    data: {
                        name: 'Some rel ' + (i + 1), description: "i am a relation", additional: true
                    }
                });
            }
            this.relUpdateTestData.nodes = _nodes;
            return this.createTestRels(relations);
        })
            .then(_relations => {
            this.relUpdateTestData.rels = _relations.map(item => item[0]);
            return Promise.resolve();
        });
    }
    static createTestUsers() {
        let numOfNodes = 2, i;
        let nodes = [];
        for (i = 0; i < numOfNodes; i++) {
            nodes.push({
                labels: ['Test', 'User'],
                data: {
                    name: 'Some user node ' + (i + 1), description: "i am a node", active: true
                }
            });
        }
        return this.createTestNodes(nodes).then((nodes) => {
            this.activeUsers = this.activeUsers.concat(nodes);
            return Promise.resolve();
        });
    }
    static relUpdateTestDataForIndex(index) {
        let fromIndex, toIndex;
        fromIndex = index * 2;
        toIndex = fromIndex + 1;
        return {
            from: this.relUpdateTestData.nodes[fromIndex],
            to: this.relUpdateTestData.nodes[toIndex],
            rel: this.relUpdateTestData.rels[index]
        };
    }
}
TestHelper.relUpdateTestData = {
    rels: [],
    nodes: []
};
TestHelper.activeUsers = [];
class AssertionHelper {
    static checkNode(node, options) {
        let i, keys, properties;
        options = options || {};
        expect(node).to.be.an.object();
        expect(Array.isArray(node.labels)).to.be.true();
        expect(typeof node.id).to.be.equal('string');
        expect(parseInt(node.id)).not.to.be.equal(NaN);
        expect(parseInt(node.id)).to.be.greaterThan(-1);
        if (options.labels && Array.isArray(options.labels)) {
            for (i = 0; i < options.labels.length; i++) {
                expect(node.labels.indexOf(options.labels[i])).to.be.greaterThan(-1);
            }
        }
        if (options.id) {
            expect(node.id).to.be.equal(options.id);
        }
        if (options.properties) {
            expect(typeof node.properties).to.be.equal('object');
            expect(node.properties).not.to.be.equal(null);
            if (typeof options.properties === 'object') {
                properties = options.properties;
                if (options.updatedProperties && typeof options.updatedProperties === 'object') {
                    properties = _.clone(options.properties);
                    _.extend(properties, options.updatedProperties);
                }
                keys = Object.keys(properties);
                for (i = 0; i < keys.length; i++) {
                    expect(node.properties[keys[i]]).to.be.equal(properties[keys[i]]);
                }
            }
        }
    }
    static checkNodeArray(nodes, assertions) {
        let i, assertion;
        for (i = 0; i < nodes.length; i++) {
            assertion = null;
            if (assertions) {
                assertion = assertions[i];
            }
            this.checkNode(nodes[i], assertion);
        }
    }
    static checkRelation(relation, options) {
        let i, keys, properties;
        options = options || {};
        expect(relation).to.be.an.object();
        expect(relation.type).to.be.a.string();
        expect(typeof relation.id).to.be.equal('string');
        expect(parseInt(relation.id)).not.to.be.equal(NaN);
        expect(parseInt(relation.id)).to.be.greaterThan(-1);
        if (options.type && typeof options.type === 'string') {
            expect(relation.type).to.be.equal(options.type);
        }
        if (options.id) {
            expect(relation.id).to.be.equal(options.id);
        }
        if (options.properties) {
            expect(typeof relation.properties).to.be.equal('object');
            expect(relation.properties).not.to.be.equal(null);
            if (typeof options.properties === 'object') {
                properties = options.properties;
                if (options.updatedProperties && typeof options.updatedProperties === 'object') {
                    properties = _.clone(options.properties);
                    _.extend(properties, options.updatedProperties);
                }
                keys = Object.keys(properties);
                for (i = 0; i < keys.length; i++) {
                    expect(relation.properties[keys[i]]).to.be.equal(properties[keys[i]]);
                }
            }
        }
    }
    static checkRelationArray(relations, assertions) {
        let i, assertion;
        for (i = 0; i < relations.length; i++) {
            assertion = null;
            if (assertions) {
                assertion = assertions[i];
            }
            this.checkRelation(relations[i], assertion);
        }
    }
}
exports.AssertionHelper = AssertionHelper;
let Neo4JStoreTest = Neo4JStoreTest_1 = class Neo4JStoreTest {
    static before(done) {
        index_1.HemeraNeo4JStore.options.neo4j = {
            driver: this.neo4j
        };
        this.clearDatabase().then(() => {
            const nats = NATS.connect({});
            this.hemera = new Hemera(nats, {
                crashOnFatal: false,
                logLevel: 'silent'
            });
            this.hemera.use(HemeraJoi);
            let url = process.env.Neo4J_URL || 'bolt://localhost';
            let user = process.env.Neo4J_USER || 'neo4j';
            let password = process.env.Neo4J_PASS || 'neo4j';
            this.hemera.use(index_1.HemeraNeo4JStore, {
                neo4j: {
                    url: url,
                    user: user,
                    password: password
                }
            });
            this.hemera.ready(function () {
                done();
            });
        });
    }
    static after(done) {
        TestHelper.cleanupData().then(done).catch(done);
    }
    static clearDatabase() {
        return Promise.resolve();
    }
    testCreate(done) {
        let labels = ['Test', 'User'];
        let properties = { name: 'Test User', active: true };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: labels,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                console.log('Created single node with id ' + resp.id);
                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, { labels: labels, properties: properties });
                TestHelper.activeUsers.push(resp);
            }, done);
        });
    }
    testCreateOne(done) {
        let labels = ['Test', 'User'];
        let properties = { name: 'Test User 1', active: true };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: labels,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                console.log('Created single node with id ' + resp.id);
                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, { labels: labels, properties: properties });
                TestHelper.activeUsers.push(resp);
            }, done);
        });
    }
    testCreateTwo(done) {
        let labels = ['Test', 'TestUser'];
        let properties = { name: 'Test User 2', active: true };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: labels,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                console.log('Created single node with id ' + resp.id);
                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, { labels: labels, properties: properties });
            }, done);
        });
    }
    testCreateMany(done) {
        let promises = [], i, count = 3, assertions = [], labels = ['Test', 'DeleteUser'], properties;
        for (i = 0; i < count; i++) {
            properties = { name: 'Delete Test User ' + i, active: true };
            promises.push(Neo4JStoreTest_1.hemera.act({
                topic: 'neo4j-store',
                cmd: 'create',
                labels: ['Test', 'DeleteUser'],
                data: properties
            }));
            assertions.push({ labels: labels, properties: properties });
        }
        Promise.all(promises).then(nodes => {
            wrapAssertions(() => {
                expect(nodes).to.be.an.array();
                expect(nodes.length).to.be.equal(3);
                Neo4JStoreTest_1.toBeUpdated = nodes[0];
                Neo4JStoreTest_1.toBeDeleted = nodes;
                AssertionHelper.checkNodeArray(nodes, assertions);
                console.log('Created many nodes with ids ' +
                    JSON.stringify(nodes.map(item => { return item.id; })));
            }, done);
        }).catch(err => {
            wrapAssertions(() => {
                expect(err).to.be.null();
            }, done);
        });
    }
    prepareUsers(done) {
        TestHelper.createTestUsers().then(done).catch(done);
    }
    testFindByLabel(done) {
        let labels = ['User'];
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                console.log('Found nodes by label with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: labels });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByLabelEmptyQuery(done) {
        let labels = ['User'];
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                console.log('Found nodes by label using empty query with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: labels });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByQuery(done) {
        let labels = ['User'];
        let query = { active: true };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels,
            query: query
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                console.log('Found nodes by query with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: labels, properties: query });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByQueryWithOptions(done) {
        let labels = ['User'];
        let query = { active: true };
        let compareData = TestHelper.activeUsers.sort((a, b) => {
            if (a.properties.name > b.properties.name) {
                return -1;
            }
            if (b.properties.name > a.properties.name) {
                return 1;
            }
            return 0;
        });
        compareData = compareData.sort((a, b) => {
            if (b.properties.description > a.properties.description) {
                return -1;
            }
            if (a.properties.description > b.properties.description) {
                return 1;
            }
            return 0;
        });
        compareData = compareData.sort((a, b) => {
            if (b.properties.active > a.properties.active) {
                return -1;
            }
            if (a.properties.active > b.properties.active) {
                return 1;
            }
            return 0;
        });
        compareData = compareData.slice(2, 4);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels,
            query: query,
            options: { offset: 2, limit: 2, orderBy: [
                    { property: 'name', desc: true }, { property: 'description' }, 'active'
                ] }
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.equal(2);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: labels, properties: query });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
                expect(resp[0].id).to.be.equal(compareData[0].id);
                expect(resp[1].id).to.be.equal(compareData[1].id);
            }, done);
        });
    }
    testFindById(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findById',
            id: Neo4JStoreTest_1.toBeUpdated.id,
        }, (err, resp) => {
            wrapAssertions(() => {
                console.log('Found node by id with id ' + resp.id);
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkNode(resp, {
                    id: Neo4JStoreTest_1.toBeUpdated.id,
                    labels: Neo4JStoreTest_1.toBeUpdated.labels,
                    properties: Neo4JStoreTest_1.toBeUpdated.properties
                });
            }, done);
        });
    }
    testUpdateOneByQuery(done) {
        let labels = ['Test', 'User'];
        let properties = { description: 'Something', updated: (new Date()) };
        let query = { name: 'Test User' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'update',
            labels: labels,
            data: properties,
            query: { name: 'Test User' }
        }, (err, resp) => {
            wrapAssertions(() => {
                console.log('Updated single node with id ' + resp.id);
                _.extend(properties, query);
                properties.updated = properties.updated.toISOString();
                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, { labels: labels, properties: properties });
            }, done);
        });
    }
    testUpdateManyByQuery(done) {
        let labels = ['Test', 'User'];
        let properties = { description: 'Something', updated: (new Date()) };
        let query = { active: true };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'update',
            labels: labels,
            data: properties,
            query: query
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                console.log('Updated many nodes with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                _.extend(properties, query);
                properties.updated = properties.updated.toISOString();
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: labels, properties: properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testUpdateById(done) {
        let labels = Neo4JStoreTest_1.toBeUpdated.labels;
        let properties = { description: 'Something else again', updated: (new Date()) };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateById',
            id: Neo4JStoreTest_1.toBeUpdated.id,
            data: properties
        }, (err, resp) => {
            console.log('Updated single node (by id) with id ' + resp.id);
            wrapAssertions(() => {
                properties.updated = properties.updated.toISOString();
                _.extend(Neo4JStoreTest_1.toBeUpdated.properties, properties);
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkNode(resp, {
                    labels: labels,
                    properties: Neo4JStoreTest_1.toBeUpdated.properties,
                    id: Neo4JStoreTest_1.toBeUpdated.id
                });
            }, done);
        });
    }
    testReplaceOneByQuery(done) {
        let labels = ['Test', 'User'];
        let properties = { name: 'Test User', description: 'Something',
            updated: (new Date()), active: true };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replace',
            labels: labels,
            data: properties,
            query: { name: 'Test User' }
        }, (err, resp) => {
            wrapAssertions(() => {
                console.log('Replaced single node with id ' + resp.id);
                properties.updated = properties.updated.toISOString();
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkNode(resp, { labels: labels, properties: properties });
            }, done);
        });
    }
    testReplaceById(done) {
        let item = Neo4JStoreTest_1.toBeUpdated;
        let properties = { name: item.properties.name, description: 'Something else replaced',
            updated: (new Date()), active: item.properties.active };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceById',
            id: item.id,
            data: properties
        }, (err, resp) => {
            console.log('Replaced single node (by id) with id ' + resp.id);
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                properties.updated = properties.updated.toISOString();
                AssertionHelper.checkNode(resp, {
                    id: Neo4JStoreTest_1.toBeUpdated.id,
                    labels: Neo4JStoreTest_1.toBeUpdated.labels,
                    properties: properties
                });
            }, done);
        });
    }
    testExistsByQuery(done) {
        let item = Neo4JStoreTest_1.toBeUpdated;
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'exists',
            query: { name: item.properties.name }
        }, (err, resp) => {
            console.log('Replaced single node (by id) with id ' + resp.id);
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
                console.log('Test exists (by query)');
            }, done);
        });
    }
    testNotExistsByQuery(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'exists',
            query: { name: 'My Tam' }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
                console.log('Test not exists (by query)');
            }, done);
        });
    }
    testExistsByLabels(done) {
        let item = Neo4JStoreTest_1.toBeUpdated;
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'exists',
            labels: item.labels
        }, (err, resp) => {
            console.log('Replaced single node (by id) with id ' + resp.id);
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
                console.log('Test exists (by labels)');
            }, done);
        });
    }
    testNotExistsByLabels(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'exists',
            labels: ['Ene', 'Mene']
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
                console.log('Test not exists (by labels)');
            }, done);
        });
    }
    testExistsById(done) {
        let item = Neo4JStoreTest_1.toBeUpdated;
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'exists',
            id: item.id,
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
                console.log('Test exists (by id) with id ' + item.id);
            }, done);
        });
    }
    testNotExistsById(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'exists',
            id: "89172381279379",
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
                console.log('Test not exists (by id)');
            }, done);
        });
    }
    testCreateRelationshipWithQueries(done) {
        let items = Neo4JStoreTest_1.toBeDeleted;
        let type = 'newRelation';
        let properties = { name: 'childOf' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: 'newRelation',
            from: {
                labels: items[0].labels,
                query: { name: items[0].properties.name }
            },
            to: {
                labels: items[1].labels,
                query: { name: items[1].properties.name }
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testCreateRelationshipWithIds(done) {
        let type = 'newRelation';
        let properties = { name: 'knows' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: type,
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[1].identity
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testCreateRelationshipMixedFromId(done) {
        let items = Neo4JStoreTest_1.toBeDeleted;
        let type = 'newRelation';
        let properties = { name: 'wants' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: type,
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                labels: items[1].labels,
                query: { name: items[1].properties.name }
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testCreateRelationshipMixedToId(done) {
        let items = Neo4JStoreTest_1.toBeDeleted;
        let type = 'newRelation';
        let properties = { name: 'wants' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: type,
            from: {
                labels: items[1].labels,
                query: { name: items[1].properties.name }
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithQueries(done) {
        let type = 'newRelation';
        let properties = { hello: 'world' };
        let query = { name: 'childOf' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: 'newRelation',
            from: {
                labels: Neo4JStoreTest_1.toBeDeleted[0].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[0].properties.name }
            },
            to: {
                labels: Neo4JStoreTest_1.toBeDeleted[1].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[1].properties.name }
            },
            query: query,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, query);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithIds(done) {
        let type = 'newRelation';
        let properties = { hello: 'dolly' };
        let query = { name: 'knows' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: type,
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[1].identity
            },
            query: query,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, query);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    beforeRelUpdates(done) {
        TestHelper.createRelationsToBeUpdated().then(done).catch(done);
    }
    testUpdateRelationshipWithMixed(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            to: {
                labels: item.to.labels,
                query: item.to.properties
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, item.rel.properties);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithOnlyOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'world' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, item.rel.properties);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithOnlyTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, item.rel.properties);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithAnyDirection(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'world' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            from: {
                id: item.to.id
            },
            to: {
                id: item.from.id
            },
            data: properties,
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, item.rel.properties);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithAnyDirectionOnOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            data: properties,
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, item.rel.properties);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithAnyDirectionOnTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'world' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            data: properties,
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                _.extend(properties, item.rel.properties);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testUpdateRelationshipWithRelId(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelationById',
            id: item.rel.id,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkRelation(resp, { type: item.rel.type,
                    properties: properties, id: item.rel.id });
            }, done);
        });
    }
    testFindRelationshipWithQueries(done) {
        let properties = { name: 'childOf' };
        let type = 'newRelation';
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: type,
            from: {
                labels: Neo4JStoreTest_1.toBeDeleted[0].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[0].properties.name }
            },
            to: {
                labels: Neo4JStoreTest_1.toBeDeleted[1].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[1].properties.name }
            },
            query: { name: 'childOf' },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithQueryAndOptions(done) {
        let properties = { description: "i am a relation" };
        let type = 'testRelation';
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                    { property: 'name', desc: true }, { property: 'description' }, 'additional'
                ] }
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithIds(done) {
        let type = 'newRelation';
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: type,
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[1].identity
            }
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithMixed(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            to: {
                labels: item.to.labels,
                query: item.to.properties
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithOnlyOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithOnlyTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithAnyDirection(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            from: {
                id: item.to.id
            },
            to: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithAnyDirectionOnOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithAnyDirectionOnTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testFindRelationshipWithRelId(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationById',
            id: item.rel.id
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkRelation(resp, { type: item.rel.type,
                    properties: item.rel.properties, id: item.rel.id });
            }, done);
        });
    }
    testRelationshipExistsWithQueries(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: 'newRelation',
            from: {
                labels: Neo4JStoreTest_1.toBeDeleted[0].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[0].properties.name }
            },
            to: {
                labels: Neo4JStoreTest_1.toBeDeleted[1].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[1].properties.name }
            },
            query: { name: 'childOf' },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithIds(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: 'newRelation',
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[1].identity
            }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithMixed(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            to: {
                labels: item.to.labels,
                query: item.to.properties
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithOnlyOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithOnlyTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithAnyDirection(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: item.to.id
            },
            to: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithAnyDirectionOnOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithAnyDirectionOnTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipExistsWithRelId(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            id: item.rel.id
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithQueries(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: 'newRelation',
            from: {
                labels: ['Dont', 'Exist'],
                query: { name: 'Oedipus' }
            },
            to: {
                labels: ['Not', 'Existing'],
                query: { name: '34 xd 75 b' }
            },
            query: { name: 'childOf' },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithIds(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: 'newRelation',
            from: {
                id: "3103515213454"
            },
            to: {
                id: "3151513515551"
            }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithMixed(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            to: {
                labels: ['Dont', 'Exists'],
                query: { name: 'Juergen' }
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithOnlyOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: "3546584813512"
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithOnlyTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            to: {
                id: "313654652135444"
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithAnyDirection(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: "16513135662"
            },
            to: {
                id: "313168165515"
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithAnyDirectionOnOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            from: {
                id: "454685661655"
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithAnyDirectionOnTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: item.rel.type,
            to: {
                id: "654962945163"
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testRelationshipNotExistsWithRelId(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            id: "65146186463161"
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp === false).to.be.true();
            }, done);
        });
    }
    testReplaceRelationshipWithQueries(done) {
        let type = 'newRelation';
        let properties = { name: 'childOf', hello: 'world replaced' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: type,
            from: {
                labels: Neo4JStoreTest_1.toBeDeleted[0].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[0].properties.name }
            },
            to: {
                labels: Neo4JStoreTest_1.toBeDeleted[1].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[1].properties.name }
            },
            query: { name: 'childOf' },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithIds(done) {
        let type = 'newRelation';
        let properties = { name: 'knows', hello: 'dolly replaced' };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: type,
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[1].identity
            },
            query: { name: 'knows' },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: type, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithMixed(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly replaced', description: "i am a relation" };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            to: {
                labels: item.to.labels,
                query: item.to.properties
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, id: item.rel.id, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithOnlyOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'world replaced', description: "i am a relation" };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, id: item.rel.id, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithOnlyTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = item.rel.properties;
        _.extend(properties, { hello: 'dolly replaced', description: "i am a relation" });
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, id: item.rel.id, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithAnyDirection(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'world replaced', description: "i am a relation" };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            from: {
                id: item.to.id
            },
            to: {
                id: item.from.id
            },
            data: properties,
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, id: item.rel.id, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithAnyDirectionOnOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly replaced', description: "i am a relation" };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            data: properties,
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, id: item.rel.id, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithAnyDirectionOnTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'world replaced', description: "i am a relation" };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            data: properties,
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ type: item.rel.type, id: item.rel.id, properties: properties });
                }
                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }
    testReplaceRelationshipWithRelId(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { hello: 'dolly replaced', description: "i am a relation" };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelationById',
            id: item.rel.id,
            data: properties
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkRelation(resp, { type: item.rel.type,
                    properties: properties, id: item.rel.id });
            }, done);
        });
    }
    testFindByRelationStartNodesByTargetAndQuery(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            query: properties,
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.from.labels,
                        id: item.from.id, properties: item.from.properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationStartNodesWithQuery(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            type: item.rel.type,
            query: properties,
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.from.labels });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationStartNodesByQueryWithOptions(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            type: item.rel.type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                    { property: 'name', desc: true }, { property: 'description' }, 'additional'
                ] }
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.from.labels });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationStartNodesByTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            to: {
                id: item.to.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.from.labels,
                        id: item.from.id, properties: item.from.properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationEndNodesByOriginAndQuery(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            query: properties,
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationEndNodesWithQuery(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            type: item.rel.type,
            query: properties,
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationEndNodesByQueryWithOptions(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            type: item.rel.type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                    { property: 'name', desc: true }, { property: 'description' }, 'additional'
                ] }
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationEndNodesByOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            from: {
                id: item.from.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationNodesByOtherNodeAndQuery(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            type: item.rel.type,
            anyNode: {
                id: item.from.id
            },
            query: properties,
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationNodesWithQuery(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            type: item.rel.type,
            query: properties,
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels.slice(0, 2) });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationNodesByQueryWithOptions(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            type: item.rel.type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                    { property: 'name', desc: true }, { property: 'description' }, 'additional'
                ] }
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels.slice(0, 2) });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testFindByRelationNodesByOtherNode(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            anyNode: {
                id: item.from.id
            },
        }, (err, resp) => {
            wrapAssertions(() => {
                let assertions = [], i;
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                for (i = 0; i < resp.length; i++) {
                    assertions.push({ labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties });
                }
                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }
    testRemoveRelationshipWithQueries(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            from: {
                labels: Neo4JStoreTest_1.toBeDeleted[0].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[0].properties.name }
            },
            to: {
                labels: Neo4JStoreTest_1.toBeDeleted[1].labels,
                query: { name: Neo4JStoreTest_1.toBeDeleted[1].properties.name }
            },
            query: { name: 'childOf' }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithIds(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[1].identity
            },
            query: { name: 'knows' }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithOriginId(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            from: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithTargetId(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            to: {
                id: Neo4JStoreTest_1.toBeDeleted[0].identity
            }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithMixed(done) {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            to: {
                labels: item.to.labels,
                query: item.to.properties
            },
            data: { hello: 'dolly' }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithAnyDirection(done) {
        let item = TestHelper.relUpdateTestDataForIndex(1);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: item.rel.type,
            from: {
                id: item.to.id
            },
            to: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithAnyDirectionOnOrigin(done) {
        let item = TestHelper.relUpdateTestDataForIndex(2);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithAnyDirectionOnTarget(done) {
        let item = TestHelper.relUpdateTestDataForIndex(3);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            anyDirection: true
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testRemoveRelationshipWithRelId(done) {
        let item = TestHelper.relUpdateTestDataForIndex(4);
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelationById',
            id: item.rel.id
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }
    testDeleteByLabel(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'remove',
            labels: ['Test', 'TestUser']
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.not.exist();
                expect(resp).to.be.a.number();
                expect(resp).to.be.equal(1);
            }, done);
        });
    }
    testDeleteByProperty(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'remove',
            labels: ['Test', 'User'],
            query: { name: 'Test User 1' }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.not.exist();
                expect(resp).to.be.a.number();
                expect(resp).to.be.equal(1);
            }, done);
        });
    }
    testDeleteByLabelAndProperty(done) {
        Neo4JStoreTest_1.hemera.act({
            topic: 'neo4j-store',
            cmd: 'remove',
            labels: ['Test', 'User'],
            query: { name: 'Test User' }
        }, (err, resp) => {
            wrapAssertions(() => {
                expect(err).to.not.exist();
                expect(resp).to.be.a.number();
                expect(resp).to.be.equal(1);
            }, done);
        });
    }
    testDeleteById(done) {
        let promises = [], i, id = 0, node;
        let count = Neo4JStoreTest_1.toBeDeleted.length;
        for (i = 0; i < count; i++) {
            node = Neo4JStoreTest_1.toBeDeleted[i];
            switch (i) {
                case 1:
                    id = parseInt(node.id);
                    break;
                case 2:
                    id = '' + node.id;
                    break;
                default:
                    id = node.identity;
                    break;
            }
            promises.push(Neo4JStoreTest_1.hemera.act({
                topic: 'neo4j-store',
                cmd: 'removeById',
                id: id
            }));
        }
        Promise.all(promises).then(nodes => {
            wrapAssertions(() => {
                expect(Array.isArray(nodes)).to.be.true();
                expect(nodes.length).to.be.greaterThan(2);
            }, done);
        }).catch(err => {
            wrapAssertions(() => {
                expect(err).to.be.null();
            }, done);
        });
    }
};
Neo4JStoreTest.toBeDeleted = [];
Neo4JStoreTest.toBeUpdated = null;
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreate", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateOne", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateTwo", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateMany", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "prepareUsers", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByLabel", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByLabelEmptyQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByQueryWithOptions", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindById", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateOneByQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateManyByQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateById", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceOneByQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceById", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testExistsByQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testNotExistsByQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testExistsByLabels", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testNotExistsByLabels", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testExistsById", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testNotExistsById", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateRelationshipWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateRelationshipWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateRelationshipMixedFromId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testCreateRelationshipMixedToId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "beforeRelUpdates", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithMixed", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithOnlyOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithOnlyTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithAnyDirection", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithAnyDirectionOnOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithAnyDirectionOnTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testUpdateRelationshipWithRelId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithQueryAndOptions", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithMixed", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithOnlyOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithOnlyTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithAnyDirection", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithAnyDirectionOnOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithAnyDirectionOnTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindRelationshipWithRelId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithMixed", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithOnlyOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithOnlyTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithAnyDirection", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithAnyDirectionOnOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithAnyDirectionOnTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipExistsWithRelId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithMixed", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithOnlyOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithOnlyTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithAnyDirection", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithAnyDirectionOnOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithAnyDirectionOnTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRelationshipNotExistsWithRelId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithMixed", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithOnlyOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithOnlyTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithAnyDirection", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithAnyDirectionOnOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithAnyDirectionOnTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testReplaceRelationshipWithRelId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationStartNodesByTargetAndQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationStartNodesWithQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationStartNodesByQueryWithOptions", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationStartNodesByTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationEndNodesByOriginAndQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationEndNodesWithQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationEndNodesByQueryWithOptions", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationEndNodesByOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationNodesByOtherNodeAndQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationNodesWithQuery", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationNodesByQueryWithOptions", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testFindByRelationNodesByOtherNode", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithQueries", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithIds", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithOriginId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithTargetId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithMixed", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithAnyDirection", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithAnyDirectionOnOrigin", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithAnyDirectionOnTarget", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testRemoveRelationshipWithRelId", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testDeleteByLabel", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testDeleteByProperty", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testDeleteByLabelAndProperty", null);
__decorate([
    mocha_typescript_1.test
], Neo4JStoreTest.prototype, "testDeleteById", null);
Neo4JStoreTest = Neo4JStoreTest_1 = __decorate([
    mocha_typescript_1.suite
], Neo4JStoreTest);
var Neo4JStoreTest_1;
//# sourceMappingURL=test.js.map