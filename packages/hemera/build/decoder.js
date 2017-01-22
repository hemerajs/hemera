"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * hemera
 * Copyright(c) 2016 Dustin Deus (deusdustin@gmail.com)
 * MIT Licensed
 * Based on https://github.com/mcollina/fast-json-parse
 */

var Decoder = function () {
  function Decoder() {
    _classCallCheck(this, Decoder);
  }

  _createClass(Decoder, null, [{
    key: "decode",
    value: function decode(msg) {

      return Parse(msg);
    }
  }]);

  return Decoder;
}();

function Parse(data) {

  if (!(this instanceof Parse)) {
    return new Parse(data);
  }

  this.error = null;
  this.value = null;

  try {

    this.value = JSON.parse(data);
  } catch (error) {

    this.error = error;
  }
}

module.exports = Decoder;
//# sourceMappingURL=decoder.js.map