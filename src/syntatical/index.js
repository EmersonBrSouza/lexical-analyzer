const Definitions = require('./syntax_definitions');

class SyntaticalAnalyzer {

  constructor (tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.firstSet = [];
    this.mountFirstSets();
  }

  match (expected, checkToken = false) {
    if (checkToken && this.currentToken == expected) {
      return true;
    } else if (!checkToken && this.currentLexeme == expected) {
      return true;
    }
    return false;
  }

  isBoolean (except = null) {
    if (Definitions.boolean.includes(this.currentLexeme)) {
      return true;
    }
    return false;
  }

  isRelationalOperator (except = null) {
    if (Definitions.relationalOperator.includes(this.currentLexeme)) {
      return true;
    }
    return false;
  }

  isLogicalOperator (except = null) {
    if (Definitions.logicalOperator.includes(this.currentLexeme)) {
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

  parseIdentifierWithoutFunction () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.accept(this.currentLexeme);
      if (this.accept('Identifier', true)) {
        this.parseIdentifierAccess()
      }
    } else if (this.match('Identifier', true)) {
      this.parseIdentifierAccess()
    }
  }

  parseArithmeticExpression () {
    if (this.match('(') || this.match('Number', true)) {
      this.parseT()
      this.parseE2()
    } else if (this.matchFirstSet(this.currentLexeme, 'scope') || this.match('Identifier', true)) {
      this.parseArithmeticIdentifier()
    } else if (this.accept('++') || this.accept('--')) {
      this.parseIdentifierWithoutFunction()
      this.parseT2()
      this.parseE2()
    }
  }

  parseArithmeticExpression2 () {
    if (this.accept('++') || this.accept('--') || this.matchFirstSet(this.currentLexeme,'t2')) {
      this.parseE2()
    }
  }

  parseE2() {
    if (this.accept('+') || this.accept('-')) {
      this.parseArithmeticExpression()
    } 
  }

  parseT () {
    this.parseF()
    this.parseT2()
  }

  parseT2 () {
    if (this.accept('*') || this.accept('/')) {
      this.parseArithmeticExpression()
    } 
  }

  parseF () {
    if (this.accept('(')) {
      this.parseArithmeticExpression()
      if (this.accept(')')) {
        return
      }
    } else if (this.accept('Number', true)) {
      return
    }
  }

  parseArithmeticIdentifier () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.accept(this.currentLexeme)
      if (this.accept('Identifier', true)) {
        this.parseIdentifierAccess()
        this.parseArithmeticExpression2()
      }
    } else if (this.accept('Identifier', true)) {
      this.parseArithmeticIdentifier3()
    }

  }

  parseArithmeticIdentifier3 () {
    if (this.matchFirstSet(this.currentLexeme, 'identifier_access')) {
      this.parseIdentifierAccess()
      this.parseArithmeticExpression2()
    } else if (this.accept('(')) {
      this.parseParametersList()
      if (this.accept(')')) {
        this.parseT2()
        this.parseE2()
      }
    }
  }

  parseLogicalRelationalExpression () {
    if (this.match('!') 
      || this.isBoolean(this.currentLexeme) 
      || this.match('String', true)
      || this.matchFirstSet(this.currentLexeme, 'arithmetic_expression') 
      || this.match('Number', true)
      || this.match('Identifier', true) ) {
      this.parseLRExpression()
    } else if (this.accept('(')) {
      this.parseLRExpression()
      if (this.accept(')')) {
        this.parseLRExpression3()
      }
    }
  }

  parseLRExpression () {
    if (this.match('!') || this.isBoolean(this.currentLexeme)) {
      this.parseLRArgument2()
      this.parseLRExpression2()
    } else if (this.match('String', true)
        || this.matchFirstSet(this.currentLexeme, 'arithmetic_expression') 
        || this.match('Number', true)
        || this.match('Identifier', true)) {
        this.parseLRArgument3()
        if (this.isRelationalOperator(this.currentLexeme)) {
          this.accept(this.currentLexeme)
          this.parseLRArgument()
          this.parseLRExpression3()
        }
    }
  }

  parseLRExpression2 () {
    if (this.isRelationalOperator(this.currentLexeme)) {
      this.accept(this.currentLexeme)
      this.parseLRArgument()
      this.parseLRExpression3()
    } else if (this.isLogicalOperator(this.currentLexeme)) {
      this.parseLRExpression3()
    }
  }

  parseLRExpression3 () {
    if (this.isLogicalOperator(this.currentLexeme)) {
      this.accept(this.currentLexeme)
      this.parseLogicalRelationalExpression()
    }
  }

  parseLRArgument () {
    if (this.match('!') || this.isBoolean(this.currentLexeme)) {
      this.parseLRArgument2()
    } else if (this.match('String', true) 
      || this.matchFirstSet(this.currentLexeme, 'arithmetic_expression') 
      || this.match('Number', true)
      || this.match('Identifier', true)) {
        this.parseLRArgument3()
    }
  }

  parseLRArgument2 () {
    if (this.match('!') || this.isBoolean(this.currentLexeme)) {
      this.accept(this.currentLexeme)
    } 
  }

  parseLRArgument2_1 () {
    if (this.match('Identifier', true)) {
      this.accept(this.currentLexeme, true)
    } else if (this.isBoolean(this.currentLexeme)) {
      this.accept(this.currentLexeme)
    }
  }

  parseLRArgument3 () {
    if (this.match('String', true)) {
      this.accept(this.currentLexeme, true)
    } else if (this.matchFirstSet(this.currentLexeme, 'arithmetic_expression') 
        || this.match('Number', true)
        || this.match('Identifier', true)) {
      this.parseArithmeticExpression()
    }
  }

  parsePrint () {
    if (this.accept('print')) {
      if (this.accept('(')) {
        this.parsePrintContent()
      }
    }
  }

  parsePrintContent () {
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true) || this.matchFirstSet('scope')) {
      this.accept(this.currentLexeme, true);
      this.parsePrintContinuation()
    }
  }

  parsePrintContinuation () {
    if (this.accept(',')) {
      this.parsePrintContent()
    } else if(this.match(')')) {
      this.printEnd();
    }
  }

  parsePrintEnd () {
    if (this.accept(')')) {
      if (this.accept(';')) {
        return
      }
    }
  }

  parseRead () {
    if (this.accept('read')) {
      if (this.accept('(')) {
        this.parseReadContent()
      }
    }
  }

  parseReadContent () {
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true) || this.matchFirstSet('scope')) {
      this.parseIdentifierWithoutFunction()
      this.parseReadContinuation()
    }
  }

  parseReadContinuation () {
    if (this.accept(',')) {
      this.parseReadContent()
    } else if(this.match(')')) {
      this.readEnd();
    }
  }

  parseReadEnd () {
    if (this.accept(')')) {
      if (this.accept(';')) {
        return
      }
    }
  }
  
  parseBody () {
    if (this.match('var')) {
      this.parseVar();
      this.parseBody2();
      if (this.accept('}')) {
        console.log('fechou func');
      }
    } else if (this.accept('}')) {
      console.log('fechou func');
    }
  }

  parseBody2 () {
    if (this.matchFirstSet(this.currentLexeme, 'commands') || this.match('Identifier', true) || this.matchFirstSet('scope')) {
      this.parseCommands()
      this.parseBody2()
    }
  }

  parseCommands() {
    if (this.match('if')) {
      this.parseConditional()
    } else if (this.match('while')) {
      this.parseLoop()
    } else if (this.match('read')) {
      this.parseRead()
    } else if (this.match('print')) {
      this.parsePrint()
    } else if (this.match('return')) {
      this.parseReturn()
    } else if (this.match('Identifier', true) || this.matchFirstSet('scope')) {
      this.parseIdentifierCommands()
    }
  }
  
  parseIdentifierCommands () {
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true) || this.matchFirstSet('scope')) {
      this.parseIdentifierWithoutFunction()
      this.parseIdentifierCommands2()
      if (this.accept(';')) {
        return
      }
    }
  }

  parseIdentifierCommands2 () {
    if (this.accept('=')) {
      this.parseIdentifierCommands2_1()
    } else if (this.accept('(')) {
      this.parseParametersList();
      if (this.accept(')')) {
        return
      }
    }
  }

  parseIdentifierCommands2_1 () {
    if (this.match('String', true) || this.match('Number') ){
      this.accept(this.currentLexeme);
    } else if (this.matchFirstSet(this.currentLexeme, 'arithmetic_expression') || this.match('Identifier', true)) {
      this.parseArithmeticExpression()
    }
  }

  parseReturn () {
    if (this.accept('return')) {
      this.parseReturnCode()
    }
  }

  parseReturnCode () {
    if (this.accept(';')) {
      return
    } else if (this.matchFirstSet('arithmetic_expression', true)
      || this.match('Number', true)
      || this.match('Identifier', true)) {

      this.parseArithmeticExpression()
      if (this.accept(';')) {
        return
      }
    }
  }
  
  parseStart() {
    if (this.accept('start')) {
      if (this.accept('(')) {
        if (this.accept(')')) {
          if (this.accept('{')) {
            this.parseBody()
            if (this.accept('}')) {
              return
            }
          }
        }
      }
    }
  }

  matchFirstSet (lexeme, set) {
    return this.firstSet[set].includes(lexeme)
  }

  mountFirstSets () {
    this.firstSet['scope'] = ['local', 'global'];
    this.firstSet['identifier_access'] = ['.', '['];
    this.firstSet['t2'] = ['*', '/'];
    this.firstSet['arithmetic_expression'] = ['++', '--', '(', 'local', 'global']
    this.firstSet['commands'] = ['while', 'if', 'print', 'read', 'return']
  }
}

module.exports = SyntaticalAnalyzer