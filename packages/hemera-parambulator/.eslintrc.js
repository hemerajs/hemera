module.exports = {
  "parser": "babel-eslint",
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  // see http://eslint.org/docs/rules/
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    //"semi": [ "warn", "never"]
  }
};
