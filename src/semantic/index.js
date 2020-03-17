class SemanticAnalyzer {
  constructor () {
    this.table = new Map();
    this.errors = [];
    this.global = {
      function: new Map(),
      procedure: new Map(),
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

  hasLocal (family, scopeId, key) {
    let selector = this.global[family].get(scopeId);

    if (selector) {
      let findParameters = selector.args.filter((el) => {
        if (el.identifier === key) {
          return el;
        }
      })
  
      let findContext = selector.context.has(key);
      
      return findParameters.length > 0 || findContext
    }

    return false
  }

  insertLocal (family, scopeId, key, data) {
    console.log(this.global[family].get(scopeId))
    // this.global[family].get(scopeId).context.set(key, data)
  }

  insertGlobal (family, key, data) {
    if (['procedure', 'function', 'start'].includes(family)) {
      data = {...data, context: new Map() }
    }
    this.global[family].set(key, data)
  }

  appendError (error) {
    this.errors.push(error)
  }

  showErrors () {
    console.log(this.global.procedure)
    console.table(this.errors)
  }
}

module.exports = SemanticAnalyzer;