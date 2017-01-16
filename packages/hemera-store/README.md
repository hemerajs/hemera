# Hemera-store package

[![npm](https://img.shields.io/npm/v/hemera-store.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-store)

Simple API to be interoperable with most database interfaces.

# Interface

* [Store API](#store-api)
  * [create](#create)
  * [update](#update)
  * [updateById](#updateById)
  * [find](#find)
  * [findById](#findById)
  * [remove](#remove)
  * [removeById](#removeById)
  * [replace](#replace)
  * [replaceById](#replaceById)
  * [exists](#exists)

Provide a unique pattern set for all common api methods. We had to choose for some conventions across document and table oriented stores.

Table-oriented | Document-oriented | Convention
--- | --- | ---
Database | Database | **Database**
Database | Collection | **Collection**
