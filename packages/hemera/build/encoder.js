'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 * Based on https://github.com/davidmarkclements/fast-safe-stringify
 */

var Encoder = function () {
  function Encoder() {
    _classCallCheck(this, Encoder);
  }

  _createClass(Encoder, null, [{
    key: 'encode',
    value: function encode(msg) {
      try {
        return {
          value: stringify(msg)
        };
      } catch (error) {
        return {
          error
        };
      }
    }
  }]);

  return Encoder;
}();

exports.default = Encoder;


function stringify(obj) {
  decirc(obj, '', [], null);
  return JSON.stringify(obj);
}

function Circle(val, k, parent) {
  this.val = val;
  this.k = k;
  this.parent = parent;
  this.count = 1;
}

Circle.prototype.toJSON = function toJSON() {
  if (--this.count === 0) {
    this.parent[this.k] = this.val;
  }
  return '[Circular]';
};

function decirc(val, k, stack, parent) {
  var keys, len, i;

  if (typeof val !== 'object' || val === null) {
    // not an object, nothing to do
    return;
  } else if (val instanceof Circle) {
    val.count++;
    return;
  } else if (parent) {
    if (~stack.indexOf(val)) {
      parent[k] = new Circle(val, k, parent);
      return;
    }
  }

  stack.push(val);
  keys = Object.keys(val);
  len = keys.length;
  i = 0;

  for (; i < len; i++) {
    k = keys[i];
    decirc(val[k], k, stack, val);
  }
  stack.pop();
}
//# sourceMappingURL=encoder.js.map