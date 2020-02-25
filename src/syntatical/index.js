const Definitions = require('./syntax_definitions');

class SyntaticalAnalyzer {

  constructor (tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme; 
  }

  accept (expected, checkToken = false) {
    if (checkToken && this.currentToken == expected) {
      this.nextToken();
      return true;
    } else if (!checkToken && this.currentLexeme == expected) {
      this.nextToken();
      return true;
    }
    return false;
  }

  acceptType (except = null) {
    if (this.currentLexeme == except) return false;
    if (Definitions.types.includes(this.currentLexeme)) {
      this.nextToken();
      return true;
    }
    return false;
  }

  acceptValue (except = null) {
    let generalGroup = ["Number", "String", "Identifier"]
    if (this.currentLexeme == except) return false;
    if ((Definitions.boolean.includes(this.currentLexeme) || generalGroup.includes(this.currentToken))) {
      this.nextToken();
      return true;
    }
    return false;
  }

  nextToken () {
    this.tokenPointer++;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme; 
  }

  startAnalisys () {
    console.table(this.tokens)
    this.parseConst();
    this.parseStruct();
  }

  parseConst () {
    if (this.accept('const')) {
      if (this.accept ('{')) {
        this.parseTypeConst()
      }
    }
  }

  parseTypeConst () {
    if (this.acceptType()) {
      this.parseConstExpression()
    }
  }

  parseConstExpression () {
    if(this.accept('Identifier', true)) {
      if (this.acceptValue()) {
        this.parseConstContinuation()
      }
    }
  }

  parseConstContinuation () {
    if (this.accept(',')) {
      this.parseConstExpression()
    } else if (this.accept(';')) {
      this.parseConstTermination()
    }
  }

  parseConstTermination () {
    if (this.accept('}')) {
      console.log('fechou');
    } else {
      this.parseTypeConst();
    }
  }

  parseStruct () {
    if (this.accept('typedef')) {

    }
  }
}

module.exports = SyntaticalAnalyzer