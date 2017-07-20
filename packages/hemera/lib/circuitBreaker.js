'use strict'

/**
 * Copyright 2016-present, Dustin Deus (deusdustin@gmail.com)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const EventEmitter = require('events')

/**
 * Based on https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
 *
 * @class CircuitBreaker
 * @extends {EventEmitter}
 */
class CircuitBreaker extends EventEmitter {
  constructor (options) {
    super()
    // states
    this.CIRCUIT_CLOSE = 'close'
    this.CIRCUIT_HALF_OPEN = 'half_open'
    this.CIRCUIT_OPEN = 'open'

    // intial state
    this._state = this.CIRCUIT_CLOSE
    // current fauilures
    this._failureCount = 0
    // successes count
    this._successesCount = 0
    // max failure threshold
    this._maxFailures = options.maxFailures
    // min successes to close the circuit breaker
    this._minSuccesses = options.minSuccesses
    // the timeout when the circuit breaker in in half open state
    this._halfOpenTime = options.halfOpenTime
    // interval when the circuit breaker will reset
    this._resetIntervalTime = options.resetIntervalTime
    // half open timer
    this._halfOpenTimer = null
  }

  /**
   *
   *
   * @readonly
   *
   * @memberof CircuitBreaker
   */
  get state () {
    return this._state
  }
  /**
   *  The failure counter used by the Closed state is time based. It's automatically reset at periodic intervals.
   *  This helps to prevent the circuit breaker from entering the Open state if it experiences occasional failures
   *
   *
   * @memberof CircuitBreaker
   */
  startResetInterval () {
    this._resetInterval = setInterval(() => {
      this._state = this.CIRCUIT_CLOSE
      this._failureCount = 0
    }, this._resetIntervalTime)
  }

  /**
   *
   *
   *
   * @memberof CircuitBreaker
   */
  clearHalfOpenTimer () {
    if (this._halfOpenTimer) {
      clearTimeout(this._halfOpenTimer)
      this._halfOpenTimer = null
    }
  }

  /**
   *
   *
   *
   * @memberof CircuitBreaker
   */
  startHalfOpenTimer () {
    // avoid starting new timer when existing already ticks
    if (!this._halfOpenTimer) {
      this._halfOpenTimer = setTimeout(() => {
        this._successesCount = 0
        this._state = this.CIRCUIT_HALF_OPEN
        this._halfOpenTimer = null
        this.emit('circuitHalfOpen', this.toJSON())
      }, this._halfOpenTime)
      // unref from event loop
      this._halfOpenTimer.unref()
    }
  }
  /**
   *
   *
   *
   * @memberof CircuitBreaker
   */
  clearResetInterval () {
    if (this._resetInterval) {
      clearInterval(this._resetInterval)
    }
  }

  /**
   *
   *
   * @returns
   *
   * @memberof CircuitBreaker
   */
  toJSON () {
    return {
      state: this._state,
      failures: this._failureCount,
      successes: this._successesCount
    }
  }

  /**
   *
   *
   * @returns
   *
   * @memberof CircuitBreaker
   */
  available () {
    return this._state !== this.CIRCUIT_OPEN
  }

  /**
   *
   *
   *
   * @memberof CircuitBreaker
   */
  success () {
    this.record(true)
  }

  /**
   *
   *
   *
   * @memberof CircuitBreaker
   */
  failure () {
    this.record(false)
  }
  /**
   *
   *
   * @param {any} pattern
   * @returns
   *
   * @memberof CircuitBreaker
   */
  record (success) {
    if (this._state === this.CIRCUIT_HALF_OPEN) {
      // The counter used by the Half-Open state records the number of successful attempts to invoke the operation.
      // The circuit breaker reverts to the Closed state after a specified number of consecutive operation invocations have been successful.
      if (success === true) {
        // request was successfully we increment it
        this._successesCount += 1
        if (this._successesCount >= this._minSuccesses) {
          this._state = this.CIRCUIT_CLOSE
          this.emit('circuitClose', this.toJSON())
          // reset failure count and clear half-open timeout
          this._failureCount = 0
          this.clearHalfOpenTimer()
        }
      } else if (success === false) {
        // If any invocation fails, the circuit breaker enters the Open state immediately and
        // the success counter will be reset the next time it enters the Half-Open state.
        this._state = this.CIRCUIT_OPEN
        this.emit('circuitOpen', this.toJSON())
        this.clearHalfOpenTimer()
      }
    } else if (this._state === this.CIRCUIT_OPEN) {
      // At this point the proxy starts a timeout timer
      // and when this timer expires the proxy is placed into the Half-Open state.
      this.startHalfOpenTimer()
    } else if (this._state === this.CIRCUIT_CLOSE) {
      if (success === false) {
        // when request fails we increment the failureCount
        this._failureCount += 1
      }

      // when we reach maximum failure threshold we open the circuit breaker and start the reset timer
      if (this._failureCount >= this._maxFailures) {
        this._state = this.CIRCUIT_OPEN
        this.emit('circuitOpen', this.toJSON())
        this.clearResetInterval()
        this.startResetInterval()
      }
    }
  }
}

module.exports = CircuitBreaker
