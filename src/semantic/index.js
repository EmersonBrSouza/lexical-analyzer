class SemanticAnalyzer {
  constructor () {
    this.table = new Map();
  }

  insertIfNotExists (key, value) {
    let shouldInsert = true;
    if (shouldInsert) {
      console.log(key, value);
    }
  }

  insert (key, value) {
    if (!this.table.has(key)) {
      this.table.set(key, value);
      console.log(this.table)
      return true;
    }
    return false;
  }
  
  replace (key, value) {
    this.table.set(key, value);
  }

  search (key, criteria = []) {
    if (criteria) {
      let found = false;
      criteria.forEach(element => {
        if (element == key) {
          found = true;
        }
      });
      return true
    }
    return this.table.get(key)
  }

  remove (key) {
    this.table.delete(key)
  }
}

module.exports = SemanticAnalyzer;