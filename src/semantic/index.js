class SemanticAnalyzer {
  constructor () {
    this.table = new Map();
    this.errors = [];
    this.global = {
      functions: new Map(),
      const: new Map(),
      var: new Map(),
      struct: new Map()
    }

    this.local = {
      var: new Map()
    }
  }

  checkType (type, value) {
    switch (type) {
      case 'int':
        return Number.isInteger(parseInt(value))
      case 'string':
        let isString = parseInt(value) || value;
        return typeof isString === 'string'
      case 'real':
        return parseFloat(value) % 1 === 0
      case 'boolean':
        return ['true', 'false'].includes(value)
      default:
        break;
    }
  }

  has (key, scope, filter = []) {
    return filter.filter((el) => {
      if (this[scope][el].has(key)) {
        return this[scope][el].get(key)
      }
    }).length > 0;
  }

  insertGlobal (family, key, data) {
    this.global[family].set(key, data)
  }

  appendError (error) {
    this.errors.push(error)
  }

  showErrors () {
    console.table(this.global.struct.get('o'))
    console.table(this.errors)
  }
}

module.exports = SemanticAnalyzer;