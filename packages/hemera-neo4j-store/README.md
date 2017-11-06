# ![Neo4j](https://avatars1.githubusercontent.com/u/201120?v=4&s=32 "Neo4j") Hemera-neo4j-store package

This is a plugin to use [Neo4j](https://neo4j.com) with Hemera.

Execute any Cypher query from anywhere. For more details [Cypher Query Language](https://neo4j.com/developer/cypher/)

### Running the tests

Install and start Neo4j before starting.

See [Documentation](https://neo4j.com/developer/get-started/), for Ubuntu or other Linux distributions please google how to set up and install as a service. Mostly you can use your default package manager after giving it the package origin for Neo4j.

```
npm run test
```

Optional change the authentication for the test database by extending the node.js environment variables with the following vars;

```
Neo4J_URL=bolt://your.server
Neo4J_USER=your-neo4j-user
Neo4J_PASS=your-neo4j-password
```

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const HemeraJoi = require('hemera-joi')
const nats = require('nats').connect()
const HemeraArango = require('hemera-arango-store')

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraJoi)
hemera.use(HemeraNeo4JStore, {
  neo4j: {
    url: 'bolt://localhost',
    user: 'neo4j',
    password: 'neo4j'
  }
})

hemera.ready(() => {

  hemera.act({
    topic: 'neo4j-store',
    cmd: 'executeCypherQuery',
    query: `MATCH (n:MyLabel {name: {name} }) RETURN n`,
    parameters: {
        name: 'test'
    }
  }, function (err, resp) {

    this.log.info(resp[0].n, 'Query result')
  })

  const user = {
    name: 'olaf'
  }

  hemera.act({
    topic: 'neo4j-store',
    cmd: 'executeCypherQuery',
    query: `CREATE (n:User {name: {name} }) RETURN n`,
    parameters: user
  }, function (err, resp) {

    this.log.info(resp[0].n, 'Query result')
  })

})
```

#### Dependencies
- hemera-joi

## API

See [Store](https://github.com/hemerajs/hemera/tree/master/packages/hemera-store) Interface.

## Custom Types

### mainly used in patterns / queries

#### Identity

Represents the decimal id used in neo4j. 
Please see the [Driver Documentation](https://github.com/neo4j/neo4j-javascript-driver#read-integers) for further explanation.

```
Identity {
    low: number,
    heigh: number
}
```

#### ListOptions, OrderDescription

Options to set list query parameters to cypher query

```
OrderDescription {
    property: string
    desc: boolean // optional, defaulsts to false
}

ListOptions {
    orderby: Array // can be string or OrderDescription or mixed
    limit: number
    offset: number // also known as SKIP
}
```

#### NodeQuery

There are two options for this type. 

For one you can query a node by its labels as a string-array and a query as object (see below). Both are optional. But one must be given.

```
NodeQuery {
    labels: Array<string>,
    query: Object // key = property name, value = value, so far no qualifiers like $lt etc. in Mongo, just equal,
}
```

The other is to query by the node Id. This can be an Identity object or a numeric string or a number value

```
NodeQuery {
    id: Identity | string | number
}
```

#### RelationQuery

There are two options for this type. 

For one you can query a node by its labels as a string-array and a query as object (see below). Both are optional. But one must be given.

```
RelationQuery {
    type: string,
    query: Object // key = property name, value = value, so far no qualifiers like $lt etc. in Mongo, just equal,
}
```

The other is to query by the node Id. This can be an Identity object or a numeric string or a number value

```
RelationQuery {
    id: Identity | string | number
}
```

### mainly used in returned objects

#### data representations

These are plain js objects that stored meta data and can be created from and generated into v and Neo4JRelationModel

```
INeo4JNodeRepresentation
{
    id: string,
    _meta: {
        labels: Array<string>
    }
    <Property>: <Value>
}

INeo4JRelationRepresentation
{
    id: string,
    _meta: {
        type: string
    }
    <Property>: <Value>
}
```

#### Neo4JNodeModel

represents a node and its meta-values

```
Neo4JNodeModel
{
    identity: Identity | string | number // node id
    properties: object // properties of the node
    labels: Array<string>
    toObject() // -> returns INeo4JNodeRepresentation
    initFromObject(object: object) // sets values as properties and meta data -> returns itself
    
    setLabels(labels: string | Array<string>) // -> returns itself
    addLabel(label: string) // -> returns itself
    removeLabel(label: string) // -> returns itself
    
    static fromObject(object: object | , label?: string | Array<string>) // label is an optional parameter -> returns new Neo4JNodeModel
    static fromArray(objects: Array<object>, labels?: string | Array<string>) // labels is an optional parameter -> returns an array of new Neo4JNodeModel instances
}
```

#### Neo4JRelationModel

represents a relation and its meta-values

```
Neo4JRelationModel
{
    identity: Identity | string | number // node id
    properties: object // properties of the node
    type: string // the relationship type in Neo4j
    toObject() // -> returns INeo4JRelationRepresentation
    initFromObject(object: any) // sets values as properties and meta data -> returns itself
    
    static fromObject(object: object | , label?: string | Array<string>) // label is an optional parameter -> returns new Neo4JRelationModel
    static fromArray(objects: Array<object>, labels?: string | Array<string>) // labels is an optional parameter -> returns an array of new Neo4JRelationModel instances
}
```


## Database specific interface

* [Neo4j API](#arango-api)
  * [Relationship API](#collection-api)
    * [createRelation](#createRelation)
  * [Query API](#query-api)
    * [executeAqlQuery](#executeaqlquery)
  * [Transaction API](#transaction-api)
    * [executeTransaction](#executetransaction)
  * [Database API](#database-api)
    * [createDatabase](#createdatabase)
  
 
-------------------------------------------------------
### create

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `create`
* `labels`: the nodes `Array<string>` *(optional)*
* `data`: the node data `object` or `null` *(optional)*

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'create',
  labels: ['Person'],
  data: { name: 'John Doe' }
}, function(err, resp) ...)
```

-> Will return the created node as `Neo4JNodeModel`

-------------------------------------------------------
### update

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `update`
* `labels`: the nodes `Array<string>` *(optional)*
* `query`: query which identifies the node by property / properties `object` *(optional)*
* `data`: the node data `object` or `null` *(optional)*

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'update',
  labels: ['Person'],
  query: { name: 'John Doe' },
  data: { some: 'data' }
}, function(err, resp) ...)
```

-> Will return the updated node as `Neo4JNodeModel`

-------------------------------------------------------
### updateById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `updateById`
* `id`: the node id `number` or `string` or `Identity`
* `data`: the node data `object` or `null`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'updateById',
  id: { name: 'John Doe' },
  data: { some: 'data' }
}, function(err, resp) ...)
```

-> Will return the updated node as `Neo4JNodeModel`

-------------------------------------------------------
### replace

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `replace`
* `labels`: the nodes `Array<string>` *(optional)*
* `query`: query which identifies the node by property / properties `object`
* `data`: the node data `object`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'replace',
  labels: ['Person'],
  query: { name: 'John Doe' },
  data: { name: 'James Doe', some: 'information' }
}, function(err, resp) ...)
```

-> Will return the replaced nodes as `Array<Neo4JNodeModel>`

-------------------------------------------------------
### replaceById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `replaceById`
* `id`: the node id `number` or `string` or `Identity`
* `data`: the node data `object`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'replaceById',
  id: { name: 'John Doe' },
  data: { name: 'Jack Doe', some: 'data' }
}, function(err, resp) ...)
```

-> Will return the replaced node as `Neo4JNodeModel`

-------------------------------------------------------
### remove

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `remove`
* `labels`: the nodes `Array<string>` *(optional)*
* `query`: query which identifies the node by property / properties `object` *(optional)*

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'remove',
  labels: ['Person'],
  query: { name: 'John Doe' }
}, function(err, resp) ...)
```

-> Will return the deleted node ids as `Array<number>`

-------------------------------------------------------
### removeById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `removeById`
* `id`: the node id `number` or `string` or `Identity`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'removeById',
  id: { name: 'John Doe' },
  data: { name: 'Jack Doe', some: 'data' }
}, function(err, resp) ...)
```

-> Will return the deleted node id as `number`

-------------------------------------------------------
### find

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `find`
* `labels`: the nodes `Array<string>` *(optional)*
* `query`: query which identifies the node by property / properties `object` *(optional)*

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'find',
  labels: ['Person'],
  query: { name: 'John Doe' }
}, function(err, resp) ...)
```

-> Will return the found nodes as `Array<Neo4JNodeModel>`

-------------------------------------------------------
### findById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findById`
* `id`: the node id `number` or `string` or `Identity`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findById',
  id: { name: 'John Doe' }
}, function(err, resp) ...)
```

-> Will return the found node as `Neo4JNodeModel`

-------------------------------------------------------
### exists

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findById`
* `labels`: the nodes `Array<string>` *(optional)*
* `query`: query which identifies the node by property / properties `object` *(optional)*
* `id`: the node id `number` or `string` or `Identity` *(optional)*

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findById',
  labels: ['Person'],
  query: { name: 'John Doe' },
  id: { name: 'John Doe' }
}, function(err, resp) ...)
```

-> Will return true if the node exists `boolean`

-------------------------------------------------------
### createRelation

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `createRelation`
* `type`: the relationship type `string`
* `from`: the start node `NodeQuery`
* `to`: the target node id `NodeQuery`
* `data`: the relationship data `object` or `null` *(optional)*

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'createRelation',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  to: { id: 102 },
  data: { some: 'information' }
}, function(err, resp) ...)
```

-> Will return the created relation as `Neo4JRelationModel`

-------------------------------------------------------
### updateRelation

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `updateRelation`
* `type`: the relationship type `string` *(optional)*
* `from`: the start node query `NodeQuery` *(optional)*
* `to`: the target node query `NodeQuery` *(optional)*
* `anyDirection`: set this to true if the direction is irrelevant `boolean` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*
* `data`: the relationship data `object`

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'updateRelation',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  to: { id: 102 },
  anyDirection: true,
  query: { some: 'information' },
  data: { some: 'other information' }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'updateRelation',
  to: { id: 102 },
  anyDirection: true,
  data: { info: 'any direction, any origin' }
}, function(err, resp) ...)
```

-> Will return the replaced relations as `Array<Neo4JRelationModel>`

-------------------------------------------------------
### updateRelationById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `updateRelationById`
* `id`: the relationship id (not id of a node) `number` or `string` or `Identity`
* `data`: the relationship data `object`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'updateRelationById',
  id: 102,
  data: { info: 'updated this via id' }
}, function(err, resp) ...)
```

-> Will return the updated relation as `Neo4JRelationModel`

-------------------------------------------------------
### replaceRelation

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `replaceRelation`
* `type`: the relationship type `string` *(optional)*
* `from`: the start node query `NodeQuery` *(optional)*
* `to`: the target node query `NodeQuery` *(optional)*
* `anyDirection`: set this to true if the direction is irrelevant `boolean` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*
* `data`: the relationship data `object`

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'replaceRelation',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  to: { id: 102 },
  anyDirection: true,
  query: { some: 'information' },
  data: { name: 'test', some: 'other information' }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'replaceRelation',
  to: { id: 102 },
  anyDirection: true,
  data: { name: 'test', some: 'other information', info: 'any direction, any origin' }
}, function(err, resp) ...)
```

-> Will return the replaced relations as `Array<Neo4JRelationModel>`

-------------------------------------------------------
### replaceRelationById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `replaceRelationById`
* `id`: the relationship id (not id of a node) `number` or `string` or `Identity`
* `data`: the relationship data `object`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'replaceRelationById',
  id: 102,
  data: { name: 'test', some: 'other information', info: 'any direction, any origin' }
}, function(err, resp) ...)
```

-> Will return the updated relation as `Neo4JRelationModel`

-------------------------------------------------------
### removeRelation

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `removeRelation`
* `type`: the relationship type `string` *(optional)*
* `from`: the start node query `NodeQuery` *(optional)*
* `to`: the target node query `NodeQuery` *(optional)*
* `anyDirection`: set this to true if the direction is irrelevant `boolean` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'removeRelation',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  to: { id: 102 },
  anyDirection: true,
  query: { some: 'information' }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'removeRelation',
  to: { id: 102 },
  anyDirection: true
}, function(err, resp) ...)
```

-> Will return the deleted relation ids `Array<number>`

-------------------------------------------------------
### removeRelationById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `removeRelationById`
* `id`: the relationship id (not id of a node) `number` or `string` or `Identity`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'removeRelationById',
  id: 102
}, function(err, resp) ...)
```

-> Will return the deleted relation id `number`

-------------------------------------------------------
### findRelation

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findRelation`
* `type`: the relationship type `string` *(optional)*
* `from`: the start node query `NodeQuery` *(optional)*
* `to`: the target node query `NodeQuery` *(optional)*
* `anyDirection`: set this to true if the direction is irrelevant `boolean` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*
* `options`: list options for the response `ListOptions` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelation',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  to: { id: 102 },
  anyDirection: true,
  query: { some: 'information' },
  options: {
      offset: 3,
      limit: 10,
      orderBy: ['name', { property: 'info', desc: true}]
  }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelation',
  to: { id: 102 },
  anyDirection: true
}, function(err, resp) ...)
```

-> Will return the found relations as `Array<Neo4JNodeModel>`

-------------------------------------------------------
### findRelationById

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findRelationById`
* `id`: the relationship id (not id of a node) `number` or `string` or `Identity`

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelationById',
  id: 102
}, function(err, resp) ...)
```

-> Will return the found relation as `Neo4JNodeModel` or `null` if not found

-------------------------------------------------------
### relationExists

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `relationExists`
* `type`: the relationship type `string` *(optional)*
* `from`: the start node query `NodeQuery` *(optional)*
* `to`: the target node query `NodeQuery` *(optional)*
* `anyDirection`: set this to true if the direction is irrelevant `boolean` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'relationExists',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  to: { id: 102 },
  anyDirection: true,
  query: { some: 'information' }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'relationExists',
  query: { id: 123 },
  anyDirection: true
}, function(err, resp) ...)
```

-> Will return true if the relation exists `boolean`

-------------------------------------------------------
### findRelationStartNodes

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findRelationStartNodes`
* `type`: the relationship type `string` *(optional)*
* `to`: the target node query `NodeQuery` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*
* `options`: list options for the response `ListOptions` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelationStartNodes',
  type: 'friendOf',
  to: {
    query: { name: 'John Doe' }    
  },
  query: { some: 'information' },
  options: {
      offset: 3,
      limit: 10,
      orderBy: ['name', { property: 'info', desc: true}]
  }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelationStartNodes',
  to: { id: 102 }
}, function(err, resp) ...)
```

-> Will return the replaced nodes as `Array<Neo4JNodeModel>`

-------------------------------------------------------
### findRelationEndNodes

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findRelationEndNodes`
* `type`: the relationship type `string` *(optional)*
* `from`: the origin node query `NodeQuery` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*
* `options`: list options for the response `ListOptions` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelationEndNodes',
  type: 'friendOf',
  from: {
    query: { name: 'John Doe' }    
  },
  query: { some: 'information' },
  options: {
      offset: 3,
      limit: 10,
      orderBy: ['name', { property: 'info', desc: true}]
  }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findRelationEndNodes',
  from: { id: 102 }
}, function(err, resp) ...)
```

-> Will return the replaced nodes as `Array<Neo4JNodeModel>`

-------------------------------------------------------
### findNodesOnRelation

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `findNodesOnRelation`
* `type`: the relationship type `string` *(optional)*
* `anyNode`: any connected node query `NodeQuery` *(optional)*
* `query`: a query to find / filter the relation(s) `RelationQuery` *(optional)*
* `options`: list options for the response `ListOptions` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findNodesOnRelation',
  type: 'friendOf',
  anyNode: {
    query: { name: 'John Doe' }    
  },
  query: { some: 'information' },
  options: {
      offset: 3,
      limit: 10,
      orderBy: ['name', { property: 'info', desc: true}]
  }
}, function(err, resp) ...)
```
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findNodesOnRelation',
  anyNode: { id: 102 }
}, function(err, resp) ...)
```

-> Will return the replaced nodes as `Array<Neo4JNodeModel>`

-------------------------------------------------------
### executeCypherQuery

The pattern is:

* `topic`: is the store name to publish to `neo4j-store`
* `cmd`: is the command to execute `executeCypherQuery`
* `query`: the [Cypher](https://neo4j.com/developer/cypher/) query string `string`
* `properties`: properties and values used in query placeholders `object` *(optional)*

Note that one indication for the node must be given

Example:
```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findNodesOnRelation',
  query: 'MATCH (n:Some { name: "test" }) RETURN n'
}, function(err, resp) ...)
```

```js
hemera.act({
  topic: 'neo4j-store',
  cmd: 'findNodesOnRelation',
  query: 'MATCH (n:Some { name: {name} }) RETURN n',
  properties: {name: 'test'}
}, function(err, resp) ...)
```

-> Will return the plan result as coming from [Neo4j Driver](https://github.com/neo4j/neo4j-javascript-driver)

-------------------------------------------------------