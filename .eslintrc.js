module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "mocha": true
  },
  "plugins": [],
  "extends": [
    "standard"
  ],
  "parserOptions": {
    "sourceType": "module"
  },
  "globals": {
    "Hemera": true,
    "expect": true,
    "HemeraTestsuite": true,
    "HemeraUtil": true,
    "Sinon": true,
    "Code": true,
    "UnauthorizedError": true
  },
  // see http://eslint.org/docs/rules/
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"]
  }
};