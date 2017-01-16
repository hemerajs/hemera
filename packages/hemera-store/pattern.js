'use strict'

/**
 *
 *
 * @class StorePattern
 */
class StorePattern {


  /**
   *
   *
   * @static
   * @param {any} topic
   * @returns
   *
   * @memberOf StorePattern
   */
  static create(topic) {

    return {
      topic,
      cmd: 'create',
      collection: {
        required$: true,
        type$: 'string'
      },
      data: {
        type$: 'object'
      }
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
  static remove(topic) {

    return {
      topic,
      cmd: 'remove',
      query: {
        type$: 'object',
        default$: {}
      }
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
  static removeById(topic) {

    return {
      topic,
      cmd: 'removeById',
      id: {
        required$: true,
        type$: 'object'
      }
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
  static update(topic) {

    return {
      topic,
      cmd: 'update',
      data: {
        type$: 'object'
      },
      query: {
        type$: 'object',
        default$: {}
      }
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
  static updateById(topic) {

    return {
      topic,
      cmd: 'updateById',
      data: {
        type$: 'object'
      },
      id: {
        required$: true,
        type$: 'object'
      }

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
  static find(topic) {

    return {
      topic,
      cmd: 'find',
      query: {
        type$: 'object',
        default$: {}
      },
      options: {
        type$: 'object',
        default$: {}
      }
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
      id: {
        required$: true,
        type$: 'object'
      }
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
  static replace(topic) {

    return {
      topic,
      cmd: 'replace',
      data: {
        type$: 'object'
      },
      query: {
        type$: 'object',
        default$: {}
      }
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
  static replaceById(topic) {

    return {
      topic,
      cmd: 'replaceById',
      data: {
        type$: 'object'
      },
      id: {
        required$: true,
        type$: 'object'
      }
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
  static exists(topic) {

    return {
      topic,
      cmd: 'exists',
      query: {
        required$: true,
        type$: 'object'
      }
    }
  }
}

module.exports = StorePattern
