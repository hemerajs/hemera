//----------------------------------------------------------------------------------------------------------
import { suite, test, slow, timeout } from "mocha-typescript";
import * as HemeraTestsuite from 'hemera-testsuite';
import * as Neo4JLib from "neo4j-driver";
import {HemeraNeo4JStore} from "../lib/index";

import Hemera = require("nats-hemera");
import * as NATS from "nats";

import HemeraJoi = require('hemera-joi');

import * as Code from 'code';
import {Neo4JNodeModel, Neo4JRelationModel} from "../lib/model";

import * as _ from 'lodash';

const Neo4J = Neo4JLib.v1;
const expect = Code.expect;
//----------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------
function wrapAssertions( assertions: () => void, done: (err?: Error) => void ): void
//----------------------------------------------------------------------------------------------------------
{
    try {
        assertions();
        done();
    } catch (err) {
        done(err);
    }
}


//----------------------------------------------------------------------------------------------------------
class TestHelper
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    static relUpdateTestData = {
        rels: [],
        nodes: []
    };

    static activeUsers: any[] = []; // used for testing skip and order on nodes (requested with active: true)
    //------------------------------------------------------------------------------------------------------


    //------------------------------------------------------------------------------------------------------
    private static createTestNode(node: { labels: string | string[], data: any }): Promise<Neo4JNodeModel>
    //------------------------------------------------------------------------------------------------------
    {
        return Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: node.labels,
            data: node.data
        });
    }


    //------------------------------------------------------------------------------------------------------
    private static createTestNodes(
        nodes: [{ labels: string | string[], data: any }]): Promise<Neo4JNodeModel[]>
    //------------------------------------------------------------------------------------------------------
    {
        let promises: Promise<Neo4JNodeModel>[] = [];

        nodes.forEach(node => {
            promises.push(this.createTestNode(node));
        });

        return Promise.all(promises);
    }


    //------------------------------------------------------------------------------------------------------
    private static createTestRel(
        rel: { from: any, to: any, type: string, data?: any }): Promise<Neo4JRelationModel>
    //------------------------------------------------------------------------------------------------------
    {
        return Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            from: rel.from,
            to: rel.to,
            type: rel.type,
            data: rel.data
        });
    }


    //------------------------------------------------------------------------------------------------------
    private static createTestRels(
        rels: [{ from: any, to: any, type: string, data?: any }]): Promise<Neo4JRelationModel[]>
    //------------------------------------------------------------------------------------------------------
    {
        let promises: Promise<Neo4JRelationModel>[] = [];

        rels.forEach(rel => {
            promises.push(this.createTestRel(rel));
        });

        return Promise.all(promises);
    }


    //------------------------------------------------------------------------------------------------------
    static cleanupData(): Promise<void>
    //------------------------------------------------------------------------------------------------------
    {
        return Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'executeCypherQuery',
            query: `MATCH (n:Test) OPTIONAL MATCH (n)-[r]-() DELETE r,n`
        }).then(() => {
            return Promise.resolve();
        });
    }


    //------------------------------------------------------------------------------------------------------
    static createRelationsToBeUpdated(): Promise<void>
    //------------------------------------------------------------------------------------------------------
    {
        let numOfNodes, numOfRels = 5, i;
        let nodes: any = [], labels: string[];

        let relations: any = [];

        numOfNodes = numOfRels * 2;

        for( i = 0; i < numOfNodes; i++) {
            labels = ['Test', 'Additional', 'TestStart'];

            if ( i % 2 ) {
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

                for( i = 0; i < numOfRels; i++) {
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
            .then( _relations => {

                this.relUpdateTestData.rels = _relations.map(item => item[0]);

                return Promise.resolve();
            })
        ;
    }


    //------------------------------------------------------------------------------------------------------
    static createTestUsers(): Promise<void>
    //------------------------------------------------------------------------------------------------------
    {
        let numOfNodes = 2, i;
        let nodes: any = [];

        for( i = 0; i < numOfNodes; i++) {
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


    //------------------------------------------------------------------------------------------------------
    static relUpdateTestDataForIndex(index):
        { from: Neo4JNodeModel, to: Neo4JNodeModel, rel: Neo4JRelationModel}
    //------------------------------------------------------------------------------------------------------
    {
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


//----------------------------------------------------------------------------------------------------------
export interface NodeAssertions
//----------------------------------------------------------------------------------------------------------
{
    labels?: string[];
    properties?: { [key:string]: any };
    updatedProperties?: { [key:string]: any };
    id?: string;
}


//----------------------------------------------------------------------------------------------------------
export interface RelationAssertions
//----------------------------------------------------------------------------------------------------------
{
    type?: string;
    properties?: { [key:string]: any };
    updatedProperties?: { [key:string]: any };
    id?: string;
}


//----------------------------------------------------------------------------------------------------------
export class AssertionHelper
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    static checkNode(node: Neo4JNodeModel, options?: NodeAssertions)
    //------------------------------------------------------------------------------------------------------
    {
        let i, keys: string[], properties: any;

        options = options || {};
        expect(node).to.be.an.object();
        expect(Array.isArray(node.labels)).to.be.true();
        expect(typeof node.id).to.be.equal('string');
        expect(parseInt(node.id)).not.to.be.equal(NaN);
        expect(parseInt(node.id)).to.be.greaterThan(-1);

        if ( options.labels && Array.isArray(options.labels) ) {
            for( i = 0; i < options.labels.length; i++ ) {
                expect( node.labels.indexOf(options.labels[i]) ).to.be.greaterThan(-1);
            }
        }

        if ( options.id ) {
            expect(node.id).to.be.equal(options.id);
        }

        if ( options.properties ) {

            expect(typeof node.properties).to.be.equal('object');
            expect(node.properties).not.to.be.equal(null);

            if ( typeof options.properties === 'object' ) {

                properties = options.properties;

                if ( options.updatedProperties && typeof options.updatedProperties === 'object' ) {
                    properties = _.clone(options.properties);
                    _.extend(properties, options.updatedProperties);
                }

                keys = Object.keys(properties);

                for( i = 0; i < keys.length; i++ ) {
                    expect( node.properties[keys[i]] ).to.be.equal(properties[keys[i]]);
                }

            }
        }
    }


    //------------------------------------------------------------------------------------------------------
    static checkNodeArray(nodes: Neo4JNodeModel[], assertions?: NodeAssertions[])
    //------------------------------------------------------------------------------------------------------
    {
        let i, assertion;

        for ( i = 0; i < nodes.length; i++ ) {

            assertion = null;

            if (assertions) {
                assertion = assertions[i];
            }

            this.checkNode(nodes[i], assertion);
        }
    }


    //------------------------------------------------------------------------------------------------------
    static checkRelation(relation: Neo4JRelationModel, options?: RelationAssertions)
    //------------------------------------------------------------------------------------------------------
    {
        let i, keys: string[], properties: any;

        options = options || {};
        expect(relation).to.be.an.object();
        expect(relation.type).to.be.a.string();
        expect(typeof relation.id).to.be.equal('string');
        expect(parseInt(relation.id)).not.to.be.equal(NaN);
        expect(parseInt(relation.id)).to.be.greaterThan(-1);

        if ( options.type && typeof options.type === 'string' ) {
            expect( relation.type ).to.be.equal(options.type );
        }

        if ( options.id ) {
            expect(relation.id).to.be.equal(options.id);
        }

        if ( options.properties ) {

            expect(typeof relation.properties).to.be.equal('object');
            expect(relation.properties).not.to.be.equal(null);

            if ( typeof options.properties === 'object' ) {

                properties = options.properties;

                if ( options.updatedProperties && typeof options.updatedProperties === 'object' ) {
                    properties = _.clone(options.properties);
                    _.extend(properties, options.updatedProperties);
                }

                keys = Object.keys(properties);

                for( i = 0; i < keys.length; i++ ) {
                    expect( relation.properties[keys[i]] ).to.be.equal(properties[keys[i]]);
                }

            }
        }
    }


    //------------------------------------------------------------------------------------------------------
    static checkRelationArray(relations: Neo4JRelationModel[], assertions?: RelationAssertions[])
    //------------------------------------------------------------------------------------------------------
    {
        let i, assertion;

        for ( i = 0; i < relations.length; i++ ) {

            assertion = null;

            if (assertions) {
                assertion = assertions[i];
            }

            this.checkRelation(relations[i], assertion);
        }
    }
}



//----------------------------------------------------------------------------------------------------------
@suite
class Neo4JStoreTest
//----------------------------------------------------------------------------------------------------------
{

    //------------------------------------------------------------------------------------------------------
    static neo4j;
    static hemera: Hemera;

    static toBeDeleted:any[] = [];
    static toBeUpdated:any = null;
    //------------------------------------------------------------------------------------------------------


    //////////////// PREPARE ///////////////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    static before(done: Function)
    //------------------------------------------------------------------------------------------------------
    {
        HemeraNeo4JStore.options.neo4j = {
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

            this.hemera.use(HemeraNeo4JStore, {
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


    //------------------------------------------------------------------------------------------------------
    static after(done)
    //------------------------------------------------------------------------------------------------------
    {
        TestHelper.cleanupData().then(done).catch(done);
    }


    //------------------------------------------------------------------------------------------------------
    static clearDatabase(): Promise<void>
    //------------------------------------------------------------------------------------------------------
    {
        return Promise.resolve();
    }



    /////////////////////// NODES //////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    //////////////// CREATE ////////////////////////////////////////////////////////////////////////////////


    //------------------------------------------------------------------------------------------------------
    @test
    testCreate(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['Test', 'User'];
        let properties = { name: 'Test User', active: true};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: labels,
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {

                console.log('Created single node with id ' + resp.id);

                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, {labels: labels, properties: properties});

                TestHelper.activeUsers.push(resp);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testCreateOne(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['Test', 'User'];
        let properties = { name: 'Test User 1', active: true};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: labels,
            data: properties
        }, (err, resp) => {


            wrapAssertions(() => {

                console.log('Created single node with id ' + resp.id);

                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, {labels: labels, properties: properties});

                TestHelper.activeUsers.push(resp);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testCreateTwo(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['Test', 'TestUser'];
        let properties = { name: 'Test User 2', active: true };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'create',
            labels: labels,
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {

                console.log('Created single node with id ' + resp.id);

                expect(err).to.be.not.exists();
                AssertionHelper.checkNode(resp, {labels: labels, properties: properties});

                //TestHelper.activeUsers.push(resp);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testCreateMany(done)
    //------------------------------------------------------------------------------------------------------
    {
        let promises: Promise<any>[] = [], i, count = 3, assertions: NodeAssertions[] = [],
            labels = ['Test', 'DeleteUser'], properties: any;

        for( i = 0; i < count; i++ ) {
            properties = { name: 'Delete Test User ' + i, active: true};
            promises.push(Neo4JStoreTest.hemera.act({
                topic: 'neo4j-store',
                cmd: 'create',
                labels: ['Test', 'DeleteUser'],
                data: properties
            }));

            assertions.push({labels:labels, properties: properties});
        }

        Promise.all(promises).then(nodes => {
            wrapAssertions(() => {
                expect(nodes).to.be.an.array();
                expect(nodes.length).to.be.equal(3);
                Neo4JStoreTest.toBeUpdated = nodes[0];
                Neo4JStoreTest.toBeDeleted = nodes;

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


    //------------------------------------------------------------------------------------------------------
    @test
    prepareUsers(done)
    //------------------------------------------------------------------------------------------------------
    {
        TestHelper.createTestUsers().then(done).catch(done);
    }


    //////////////// FIND //////////////////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testFindByLabel(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['User'];
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                console.log('Found nodes by label with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels:labels})
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByLabelEmptyQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['User'];

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                console.log('Found nodes by label using empty query with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels:labels})
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['User'];
        let query = { active: true };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels,
            query: query
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                console.log('Found nodes by query with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels:labels, properties: query})
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByQueryWithOptions(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['User'];
        let query = { active: true };

        // TODO: refactor to test helper

        let compareData = TestHelper.activeUsers.sort((a, b) => {

            if ( a.properties.name > b.properties.name ) {
                return -1;
            }

            if ( b.properties.name > a.properties.name ) {
                return 1;
            }

            return 0;
        });

        compareData = compareData.sort((a, b) => {

            if ( b.properties.description > a.properties.description ) {
                return -1;
            }

            if ( a.properties.description > b.properties.description ) {
                return 1;
            }

            return 0;
        });

        compareData = compareData.sort((a, b) => {

            if ( b.properties.active > a.properties.active ) {
                return -1;
            }

            if ( a.properties.active > b.properties.active ) {
                return 1;
            }

            return 0;
        });

        compareData = compareData.slice(2, 4);

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'find',
            labels: labels,
            query: query,
            options: { offset: 2, limit: 2, orderBy: [
                {property: 'name', desc: true}, {property: 'description'}, 'active'
            ] }
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;
                //console.log('Found nodes by query with options with ids ' +
                //    JSON.stringify(resp.map(item => { return item.id; })));

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.equal(2);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels:labels, properties: query})
                }

                AssertionHelper.checkNodeArray(resp, assertions);

                expect(resp[0].id).to.be.equal(compareData[0].id);
                expect(resp[1].id).to.be.equal(compareData[1].id);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindById(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findById',
            id: Neo4JStoreTest.toBeUpdated.id,
        }, (err, resp) => {

            wrapAssertions(() => {

                console.log('Found node by id with id ' + resp.id);

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();

                AssertionHelper.checkNode(resp, {
                    id: Neo4JStoreTest.toBeUpdated.id,
                    labels: Neo4JStoreTest.toBeUpdated.labels,
                    properties: Neo4JStoreTest.toBeUpdated.properties
                });
            }, done);
        });
    }


    //////////////// UPDATE ////////////////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateOneByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['Test', 'User'];
        let properties:any = { description: 'Something', updated: (new Date()) };
        let query = { name: 'Test User' };

        Neo4JStoreTest.hemera.act({
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
                AssertionHelper.checkNode(resp, {labels: labels, properties: properties});
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateManyByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['Test', 'User'];
        let properties:any = { description: 'Something', updated: (new Date()) };
        let query = { active: true };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'update',
            labels: labels,
            data: properties,
            query: query
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                console.log('Updated many nodes with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();

                _.extend(properties, query);
                properties.updated = properties.updated.toISOString();

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels:labels, properties: properties})
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateById(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = Neo4JStoreTest.toBeUpdated.labels;
        let properties:any = { description: 'Something else again', updated: (new Date()) };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateById',
            id: Neo4JStoreTest.toBeUpdated.id,
            data: properties
        }, (err, resp) => {

            console.log('Updated single node (by id) with id ' + resp.id);

            wrapAssertions(() => {

                properties.updated = properties.updated.toISOString();
                _.extend(Neo4JStoreTest.toBeUpdated.properties, properties);
                expect(err).to.be.not.exists();
                expect(resp).to.be.an.object();
                AssertionHelper.checkNode(resp, {
                    labels: labels,
                    properties: Neo4JStoreTest.toBeUpdated.properties,
                    id: Neo4JStoreTest.toBeUpdated.id });
            }, done);
        });
    }


    //////////////// REPLACE ///////////////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceOneByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let labels = ['Test', 'User'];
        let properties: any = { name: 'Test User', description: 'Something',
            updated: (new Date()), active: true };

        Neo4JStoreTest.hemera.act({
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


    // breaks logic so far ( will only work for single entry, otherwise we alter the name and next tests will fail)
    /*//------------------------------------------------------------------------------------------------------
    @test
    testReplaceManyByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replace',
            labels: ['Test', 'User'],
            data: { name: 'Test User', description: 'Something replaced', updated: (new Date()), active: true },
            query: { name: 'Test User', active: true }
        }, (err, resp) => {

            wrapAssertions(() => {

                console.log('Replaced many nodes with ids ' +
                    JSON.stringify(resp.map(item => { return item.id; })));

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
            }, done);
        });
    }*/


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceById(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = Neo4JStoreTest.toBeUpdated;
        let properties: any = { name: item.properties.name, description: 'Something else replaced',
            updated: (new Date()), active: item.properties.active };

        Neo4JStoreTest.hemera.act({
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
                    id: Neo4JStoreTest.toBeUpdated.id,
                    labels: Neo4JStoreTest.toBeUpdated.labels,
                    properties: properties
                });
            }, done);
        });
    }


    //////////////// EXISTS ////////////////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testExistsByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = Neo4JStoreTest.toBeUpdated;
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testNotExistsByQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testExistsByLabels(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = Neo4JStoreTest.toBeUpdated;
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testNotExistsByLabels(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testExistsById(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = Neo4JStoreTest.toBeUpdated;
        Neo4JStoreTest.hemera.act({
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

    //------------------------------------------------------------------------------------------------------
    @test
    testNotExistsById(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
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


    /////////////////////// RELATIONS //////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////


    //////////////// CREATE RELATIONS //////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testCreateRelationshipWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        let items = Neo4JStoreTest.toBeDeleted;
        let type = 'newRelation';
        let properties = { name: 'childOf' };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: 'newRelation',
            from: {
                labels: items[0].labels,
                query: {name:items[0].properties.name}
            },
            to: {
                labels: items[1].labels,
                query: {name:items[1].properties.name}
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);

            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testCreateRelationshipWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        let type = 'newRelation';
        let properties = { name: 'knows' };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: type,
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[1].identity
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testCreateRelationshipMixedFromId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let items = Neo4JStoreTest.toBeDeleted;
        let type = 'newRelation';
        let properties = { name: 'wants' };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: type,
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                labels: items[1].labels,
                query: {name:items[1].properties.name}
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testCreateRelationshipMixedToId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let items = Neo4JStoreTest.toBeDeleted;
        let type = 'newRelation';
        let properties = { name: 'wants' };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'createRelation',
            type: type,
            from: {
                labels: items[1].labels,
                query: {name:items[1].properties.name}
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //////////////// UPDATE RELATIONS //////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        let type = 'newRelation';
        let properties = { hello: 'world' };
        let query = { name: 'childOf' };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: 'newRelation',
            from: {
                labels: Neo4JStoreTest.toBeDeleted[0].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[0].properties.name}
            },
            to: {
                labels: Neo4JStoreTest.toBeDeleted[1].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[1].properties.name}
            },
            query: query,
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, query);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        let type = 'newRelation';
        let properties = { hello: 'dolly' };
        let query = { name: 'knows' };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: type,
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[1].identity
            },
            query: query,
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, query);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    beforeRelUpdates(done)
    //------------------------------------------------------------------------------------------------------
    {
        TestHelper.createRelationsToBeUpdated().then(done).catch(done);
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithMixed(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly'};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, item.rel.properties);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:item.rel.type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithOnlyOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'world'};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, item.rel.properties);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:item.rel.type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithOnlyTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly'};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'updateRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, item.rel.properties);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:item.rel.type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithAnyDirection(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'world'};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, item.rel.properties);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:item.rel.type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithAnyDirectionOnOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly'};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, item.rel.properties);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:item.rel.type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithAnyDirectionOnTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'world'};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                _.extend(properties, item.rel.properties);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type:item.rel.type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testUpdateRelationshipWithRelId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly'};
        Neo4JStoreTest.hemera.act({
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


    //////////////// FIND RELATIONS ////////////////////////////////////////////////////////////////////////


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        let properties = { name: 'childOf' };
        let type = 'newRelation';

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: type,
            from: {
                labels: Neo4JStoreTest.toBeDeleted[0].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[0].properties.name}
            },
            to: {
                labels: Neo4JStoreTest.toBeDeleted[1].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[1].properties.name}
            },
            query: { name: 'childOf' },
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }

    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithQueryAndOptions(done)
    //------------------------------------------------------------------------------------------------------
    {
        let properties = { description: "i am a relation" };
        let type = 'testRelation';

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                {property: 'name', desc: true}, {property: 'description'}, 'additional'
            ] }
        }, (err, resp) => {

            wrapAssertions(() => {

                let assertions:RelationAssertions [] = [], i;

                // TODO: test order by and skip by using indexed results ( see find node test)

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: type, properties: properties})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        let type = 'newRelation';

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: type,
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[1].identity
            }
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: type})
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithMixed(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithOnlyOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithOnlyTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithAnyDirection(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithAnyDirectionOnOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            anyDirection: true
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithAnyDirectionOnTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            anyDirection: true
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type,
                        id: item.rel.id, properties: item.rel.properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindRelationshipWithRelId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: 'newRelation',
            from: {
                labels: Neo4JStoreTest.toBeDeleted[0].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[0].properties.name}
            },
            to: {
                labels: Neo4JStoreTest.toBeDeleted[1].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[1].properties.name}
            },
            query: { name: 'childOf' },
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'relationExists',
            type: 'newRelation',
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[1].identity
            }
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.be.not.exists();
                expect(resp === true).to.be.true();
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithMixed(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithOnlyOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithOnlyTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithAnyDirection(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithAnyDirectionOnOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithAnyDirectionOnTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipExistsWithRelId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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



    ///////////
    //////////


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithMixed(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithOnlyOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithOnlyTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithAnyDirection(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithAnyDirectionOnOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithAnyDirectionOnTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRelationshipNotExistsWithRelId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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


    //////////////// REPLACE RELATIONS /////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        let type = 'newRelation';
        let properties = {name: 'childOf', hello: 'world replaced'};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: type,
            from: {
                labels: Neo4JStoreTest.toBeDeleted[0].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[0].properties.name}
            },
            to: {
                labels: Neo4JStoreTest.toBeDeleted[1].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[1].properties.name}
            },
            query: { name: 'childOf' },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: type, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        let type = 'newRelation';
        let properties = { name: 'knows', hello: 'dolly replaced'};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: type,
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[1].identity
            },
            query: { name: 'knows' },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: type, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithMixed(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly replaced', description: "i am a relation"};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type, id: item.rel.id, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithOnlyOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'world replaced', description: "i am a relation"};

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type, id: item.rel.id, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithOnlyTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = item.rel.properties;
        _.extend(properties, {hello: 'dolly replaced', description: "i am a relation"});

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'replaceRelation',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            data: properties
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type, id: item.rel.id, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithAnyDirection(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'world replaced', description: "i am a relation"};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type, id: item.rel.id, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithAnyDirectionOnOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly replaced', description: "i am a relation"};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type, id: item.rel.id, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithAnyDirectionOnTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'world replaced', description: "i am a relation"};

        Neo4JStoreTest.hemera.act({
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
                let assertions:RelationAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({type: item.rel.type, id: item.rel.id, properties: properties});
                }

                AssertionHelper.checkRelationArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testReplaceRelationshipWithRelId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = {hello: 'dolly replaced', description: "i am a relation"};

        Neo4JStoreTest.hemera.act({
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


    //////////////// FIND NODES BY RELATION ////////////////////////////////////////////////////////////////


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationStartNodesByTargetAndQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            type: item.rel.type,
            to: {
                id: item.to.id
            },
            query: properties,
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.from.labels,
                        id: item.from.id, properties: item.from.properties});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationStartNodesWithQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            type: item.rel.type,
            query: properties,
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.from.labels});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationStartNodesByQueryWithOptions(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            type: item.rel.type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                {property: 'name', desc: true}, {property: 'description'}, 'additional'
            ] }
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                // TODO: test order by and skip by using indexed results ( see find node test)

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.from.labels});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationStartNodesByTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationStartNodes',
            to: {
                id: item.to.id
            },
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.from.labels,
                        id: item.from.id, properties: item.from.properties});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationEndNodesByOriginAndQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            type: item.rel.type,
            from: {
                id: item.from.id
            },
            query: properties,
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationEndNodesWithQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            type: item.rel.type,
            query: properties,
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationEndNodesByQueryWithOptions(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            type: item.rel.type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                {property: 'name', desc: true}, {property: 'description'}, 'additional'
            ] }
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                // TODO: test order by and skip by using indexed results ( see find node test)

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationEndNodesByOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findRelationEndNodes',
            from: {
                id: item.from.id
            },
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationNodesByOtherNodeAndQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            type: item.rel.type,
            anyNode: {
                id: item.from.id
            },
            query: properties,
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }



    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationNodesWithQuery(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            type: item.rel.type,
            query: properties,
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels.slice(0,2)});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationNodesByQueryWithOptions(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        let properties = { description: item.rel.properties.description };

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            type: item.rel.type,
            query: properties,
            options: { offset: 1, limit: 2, orderBy: [
                {property: 'name', desc: true}, {property: 'description'}, 'additional'
            ] }
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                // TODO: test order by and skip by using indexed results ( see find node test)

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);
                expect(resp.length).to.be.equal(2);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels.slice(0,2)});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testFindByRelationNodesByOtherNode(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);

        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'findNodesOnRelation',
            anyNode: {
                id: item.from.id
            },
        }, (err, resp) => {

            wrapAssertions(() => {
                let assertions:NodeAssertions [] = [], i;

                expect(err).to.be.not.exists();
                expect(resp).to.be.an.array();
                expect(resp.length).to.be.greaterThan(0);

                for( i = 0; i < resp.length; i++ ) {
                    assertions.push({labels: item.to.labels,
                        id: item.to.id, properties: item.to.properties});
                }

                AssertionHelper.checkNodeArray(resp, assertions);
            }, done);
        });
    }



    /////////////////////// DELETES ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////


    //////////////// REMOVE RELATIONS //////////////////////////////////////////////////////////////////////

    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithQueries(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            from: {
                labels: Neo4JStoreTest.toBeDeleted[0].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[0].properties.name}
            },
            to: {
                labels: Neo4JStoreTest.toBeDeleted[1].labels,
                query: {name:Neo4JStoreTest.toBeDeleted[1].properties.name}
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithIds(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            },
            to: {
                id: Neo4JStoreTest.toBeDeleted[1].identity
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithOriginId(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            from: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            }
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithTargetId(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'removeRelation',
            type: 'newRelation',
            to: {
                id: Neo4JStoreTest.toBeDeleted[0].identity
            }
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithMixed(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(0);
        Neo4JStoreTest.hemera.act({
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
            data: {hello: 'dolly'}
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.be.not.exists();
                expect(resp).to.be.a.number();
                expect(resp).to.be.greaterThan(0);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithAnyDirection(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(1);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithAnyDirectionOnOrigin(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(2);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithAnyDirectionOnTarget(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(3);
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testRemoveRelationshipWithRelId(done)
    //------------------------------------------------------------------------------------------------------
    {
        let item = TestHelper.relUpdateTestDataForIndex(4);
        Neo4JStoreTest.hemera.act({
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


    //////////////// REMOVE NODES //////////////////////////////////////////////////////////////////////////


    //------------------------------------------------------------------------------------------------------
    @test
    testDeleteByLabel(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
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


    //------------------------------------------------------------------------------------------------------
    @test
    testDeleteByProperty(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'remove',
            labels: ['Test', 'User'],
            query: { name: 'Test User 1'}
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.not.exist();
                expect(resp).to.be.a.number();
                expect(resp).to.be.equal(1);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testDeleteByLabelAndProperty(done)
    //------------------------------------------------------------------------------------------------------
    {
        Neo4JStoreTest.hemera.act({
            topic: 'neo4j-store',
            cmd: 'remove',
            labels: ['Test', 'User'],
            query: { name: 'Test User'}
        }, (err, resp) => {

            wrapAssertions(() => {

                expect(err).to.not.exist();
                expect(resp).to.be.a.number();
                expect(resp).to.be.equal(1);
            }, done);
        });
    }


    //------------------------------------------------------------------------------------------------------
    @test
    testDeleteById(done)
    //------------------------------------------------------------------------------------------------------
    {
        let promises: Promise<any>[] = [],
            i,
            id:any = 0,
            node: Neo4JNodeModel;

        let count = Neo4JStoreTest.toBeDeleted.length;

        for( i = 0; i < count; i++ ) {

            node = Neo4JStoreTest.toBeDeleted[i];

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

            promises.push(Neo4JStoreTest.hemera.act({
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
}