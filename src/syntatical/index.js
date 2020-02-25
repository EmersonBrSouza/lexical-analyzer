const Definitions = require('./syntax_definitions');

class SyntaticalAnalyzer {

  constructor (tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme; 
  }

  match (expected, checkToken = false) {
    if (checkToken && this.currentToken == expected) {
      return true;
    } else if (!checkToken && this.currentLexeme == expected) {
      return true;
    }
    return false;
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

  acceptVectorIndex () {
    if (this.currentToken == 'Identifier') {
      this.nextToken();
      return true;
    } else  if (this.currentToken == 'Number' && (this.currentLexeme % 1 === 0 && parseInt(this.currentLexeme) >= 0)) {
      this.nextToken();
      return true;
    } else {
      return false;
    }
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
    this.parseVar();
    this.parseStart();
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
      if (this.accept('struct')) {
        if (this.accept('Identifier', true)) {
          this.parseStructExtends();
        }
      }
    }
  }

  parseStructExtends () {
    if (this.accept('extends')) {
      if (this.accept('{')) {
        this.parseTypeStruct()
      }
    } else if (this.accept('{')) {
      this.parseTypeStruct()
    }
  }

  parseTypeStruct () {
    if (this.acceptType()) {
      this.parseStructExpression()
    }
  }

  parseStructExpression () {
    if(this.accept('Identifier', true)) {
      this.parseStructContinuation()
    }
  }

  parseStructContinuation () {    
    if (this.accept(',')) {
      this.parseStructExpression()
    } else if (this.accept(';')) {
      this.parseStructTermination()
    }
  }

  parseStructTermination () {
    if (this.accept('}')) {
      console.log('fechou');
    } else {
      this.parseTypeStruct();
    }
  }

  // Relative to Var
  parseVar () {
    if (this.accept('var')) {
      if (this.accept ('{')) {
        this.parseTypeVar()
      }
    }
  }

  // Relative to TipoVar
  parseTypeVar () {
    if (this.acceptType()) {
      this.parseVarExpression()
    }
  }

  // Relative to IdVar
  parseVarExpression () {
    if(this.accept('Identifier', true)) {
      this.parseVarContinuation()
    }
  }

  // Relative to Var2
  parseVarContinuation () {
    if (this.accept(',')) {
      this.parseVarExpression()
    } else if (this.accept(';')) {
      this.parseVarTermination()
    } else if (this.accept('=')) { 
      if (this.acceptValue()) {
        this.parseVarAttribuition();
      }
    } else if (this.match('[')) {
      this.parseVector()
    }
  }

  // Relative to Var4
  parseVarAttribuition () {
    if (this.accept(',')) {
      this.parseVarExpression();
    } else if (this.accept(';')) {
      this.parseVarTermination();
    }
  }

  // Relative to Var3
  parseVarTermination () {
    if (this.accept('}')) {
      console.log('fechou');
    } else {
      this.parseTypeVar();
    }
  }

  // Relative to Vetor
  parseVector () {
    if (this.accept('[')) {
      if(this.acceptVectorIndex()) {
        if (this.accept(']')) {
          this.parseMatrix();
        }
      }
    }
  }

  // Relative to Matriz
  parseMatrix () {
    if (this.accept('[')) {
      if(this.acceptVectorIndex()) {
        if (this.accept(']')) {
          this.parseVarAttribuition();
        }
      }
    } else {
      this.parseVarAttribuition();
    }
  }

  // Relative to ListaParametros
  parseParametersList () {
    if (this.matchFirstSet(this.currentLexeme, 'scope') || this.match('Number', true) || this.match('String', true)) {
      this.parseParametersListEnd();
      this.parseParametersListContinuation()
    }
  }

  // Relative to ContListaParametros
  parseParametersListContinuation () {
    if (this.accept(',')) {
      this.parseParametersList()
    }
  }

  // Relative to ListaParametros2
  parseParametersListEnd () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.accept(this.currentLexeme)
    } else if (this.match('Number', true) || this.match('String', true)) {
      this.accept(this.currentToken, true)
    }
  }


  parseIdentifier () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.parseScope()
      if (this.accept('Identifier', true)) {
        this.parseIdentifierAccess()
      }
    } else if(this.accept('Identifier', true)){
      this.parseIdentifierAppendix()
    }
  }

  parseIdentifierAppendix () {
    if (this.matchFirstSet(this.currentLexeme, 'identifier_access')) {
      this.parseIdentifierAccess()
    } else if (this.accept('(')) {
      this.parseParametersList()
      if (this.accept(')')) {
        return
      }
    }
  }

  // Relative to Identificador2
  parseIdentifierAccess () {
    if (this.accept('.')) {
      if (this.accept('Identifier', true)) {
        this.parseVectorDeclaration()
      }
    } else if (this.match('[')) {
      this.parseVectorDeclaration()
    }
  }

  parseVectorDeclaration () {
    if (this.accept('[')) {
      if (this.acceptVectorIndex()) {
        if (this.accept(']')) {
          this.parseVectorNewDimension()
          this.parseVectorAccess()
        }
      }
    } else if (this.match('.')) {
      this.parseVectorAccess()
    }
  }

  // Relative to Vetor2
  parseVectorNewDimension () {
    if (this.accept('[')) {
      if (this.acceptVectorIndex()) {
        if (this.accept(']')) {
          this.parseVectorNewDimension()
          this.parseVectorAccess()
        }
      }
    }
  }


  // Relative to Identificador 4
  parseVectorAccess () {
    if (this.accept('.')) {
      if (this.accept('Identifier', true)) {
        this.parseVectorDeclaration()
      }
    }
  }

  parseScope () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      if (this.accept(this.currentLexeme)) {
        if (this.accept('.')) {
          return;
        }
      }
    }
  }

  parseStart() {

  }

  matchFirstSet (lexeme, set) {
    return this.firstSet[set].includes(lexeme)
  }

  mountFirstSet () {
    this.firstSet['scope'] = ['local', 'global'];
    this.firstSet['identifier_access'] = ['.', '['];
  }
}

module.exports = SyntaticalAnalyzer