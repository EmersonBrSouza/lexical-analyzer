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
    if (checkToken && this.currentToken === expected) {
      return true;
    } else if (!checkToken && this.currentLexeme === expected) {
      return true;
    }
    return false;
  }

  matchType (except = null) {
    if (this.currentLexeme == except) return false;
    if (Definitions.types.includes(this.currentLexeme)) {
      return true;
    }
    return false;
  }

  matchValue (except = null) {
    let generalGroup = ["Number", "String", "Identifier"]
    if (this.currentLexeme == except) return false;
    if ((Definitions.boolean.includes(this.currentLexeme) || generalGroup.includes(this.currentToken))) {
      return true;
    }
    return false;
  }

  matchVectorIndex () {
    if (this.currentToken == 'Identifier') {
      return true;
    } else  if (this.currentToken == 'Number' && (this.currentLexeme % 1 === 0 && parseInt(this.currentLexeme) >= 0)) {
      return true;
    } else {
      return false;
    }
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
    if (checkToken && this.currentToken === expected) {
      this.nextToken();
      return true;
    } else if (!checkToken && this.currentLexeme === expected) {
      this.nextToken();
      return true;
    }
    console.table([{ expected, received: this.currentLexeme, receivedToken: this.currentToken, checkToken }])
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
    this.parseGenerateFuncAndProc()
    this.parseStart();
  }

  parseConst () {
    if (this.match('const')) {
      this.accept('const')
      if (this.match ('{')) {
        this.accept ('{')
        this.parseTypeConst()
      }
    }
  }

  parseTypeConst () {
    if (this.matchType()) {
      this.acceptType()
      this.parseConstExpression()
    }
  }

  parseConstExpression () {
    if(this.match('Identifier', true)) {
      this.accept('Identifier', true)
      if (this.matchValue()) {
        this.acceptValue()
        this.parseConstContinuation()
      }
    }
  }

  parseConstContinuation () {
    if (this.match(',')) {
      this.accept(',')
      this.parseConstExpression()
    } else if (this.match(';')) {
      this.accept(';')
      this.parseConstTermination()
    }
  }

  parseConstTermination () {
    if (this.match('}')) {
      this.accept('}')
      console.log('fechou const');
    } else {
      this.parseTypeConst();
    }
  }

  parseStruct () {
    if (this.match('typedef')) {
      this.accept('typedef')
      if (this.match('struct')) {
        this.accept('struct')
        if (this.match('Identifier', true)) {
          this.accept('Identifier', true)
          this.parseStructExtends();
        }
      }
    }
  }

  parseStructExtends () {
    if (this.match('extends')) {
      this.accept('extends')
      if (this.match('{')) {
        this.accept('{')
        this.parseTypeStruct()
      }
    } else if (this.match('{')) {
      this.accept('{')
      this.parseTypeStruct()
    }
  }

  parseTypeStruct () {
    if (this.matchType()) {
      this.acceptType()
      this.parseStructExpression()
    }
  }

  parseStructExpression () {
    if(this.match('Identifier', true)) {
      this.accept('Identifier', true)
      this.parseStructContinuation()
    }
  }

  parseStructContinuation () {    
    if (this.match(',')) {
      this.accept(',')
      this.parseStructExpression()
    } else if (this.match(';')) {
      this.accept(';')
      this.parseStructTermination()
    }
  }

  parseStructTermination () {
    if (this.match('}')) {
      this.accept('}')
      console.log('fechou struct');
    } else {
      this.parseTypeStruct();
    }
  }

  // Relative to Var
  parseVar () {
    if (this.match('var')) {
      this.accept('var')
      if (this.match ('{')) {
        this.accept ('{')
        this.parseTypeVar()
      }
    }
  }

  // Relative to TipoVar
  parseTypeVar () {
    if (this.matchType()) {
      this.acceptType()
      this.parseVarExpression()
    }
  }

  // Relative to IdVar
  parseVarExpression () {
    if(this.match('Identifier', true)) {
      this.accept('Identifier', true)
      this.parseVarContinuation()
    }
  }

  // Relative to Var2
  parseVarContinuation () {
    if (this.match(',')) {
      this.accept(',')
      this.parseVarExpression()
    } else if (this.match(';')) {
      this.accept(';')
      this.parseVarTermination()
    } else if (this.match('=')) { 
      this.accept('=')
      if (this.matchValue()) {
        this.acceptValue()
        this.parseVarAttribuition();
      }
    } else if (this.match('[')) {
      this.parseVector()
    }
  }

  // Relative to Var4
  parseVarAttribuition () {
    if (this.match(',')) {
      this.accept(',')
      this.parseVarExpression();
    } else if (this.match(';')) {
      this.accept(';')
      this.parseVarTermination();
    }
  }

  // Relative to Var3
  parseVarTermination () {
    if (this.match('}')) {
      this.accept('}')
      console.log('fechou var');
    } else {
      this.parseTypeVar();
    }
  }

  // Relative to Vetor
  parseVector () {
    if (this.match('[')) {
      this.accept('[')
      if(this.matchVectorIndex()) {
        this.acceptVectorIndex()
        if (this.match(']')) {
          this.accept(']')
          this.parseMatrix();
        }
      }
    }
  }

  // Relative to Matriz
  parseMatrix () {
    if (this.match('[')) {
      this.accept('[')
      if(this.matchVectorIndex()) {
        this.acceptVectorIndex()
        if (this.match(']')) {
          this.accept(']')
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
    if (this.match(',')) {
      this.accept(',')
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
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
        this.parseIdentifierAccess()
      }
    } else if(this.match('Identifier', true)) {
      this.accept('Identifier', true)
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
    if (this.match('.')) {
      this.accept('.')
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
        this.parseVectorDeclaration()
      }
    } else if (this.match('[')) {
      this.parseVectorDeclaration()
    } else { // Se for vazio
      this.nextToken()
    }
  }

  parseVectorDeclaration () {
    if (this.match('[')) {
      this.accept('[')
      if (this.acceptVectorIndex()) {
        this.matchVectorIndex()
        if (this.match(']')) {
          this.accept(']')
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
    if (this.match('[')) {
      this.accept('[')
      if (this.matchVectorIndex()) {
        this.acceptVectorIndex()
        if (this.match(']')) {
          this.accept(']')
          this.parseVectorNewDimension()
          this.parseVectorAccess()
        }
      }
    }
  }


  // Relative to Identificador 4
  parseVectorAccess () {
    if (this.match('.')) {
      this.accept('.')
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
        this.parseVectorDeclaration()
      }
    }
  }

  parseScope () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      if (this.match(this.currentLexeme)) {
        this.accept(this.currentLexeme)
        if (this.match('.')) {
          this.accept('.')
          return;
        }
      }
    }
  }

  parseIdentifierWithoutFunction () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.accept(this.currentLexeme);
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
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
    } else if (this.match('++')) {
      this.accept('++')
      this.parseIdentifierWithoutFunction()
      this.parseT2()
      this.parseE2()
    } else if (this.match('--')) {
      this.accept('--')
      this.parseIdentifierWithoutFunction()
      this.parseT2()
      this.parseE2()
    }
  }

  parseArithmeticExpression2 () {
    if (this.match('++')) {
      this.accept('++')
      this.parseE2()
    } else if (this.match('--')) {
      this.accept('--')
      this.parseE2()
    } else if (this.matchFirstSet(this.currentLexeme,'t2')) {
      this.parseE2()
    }
  }

  parseE2() {
    if (this.match('+')) {
      this.accept('+')
      this.parseArithmeticExpression()
    } else if (this.match('-')) {
      this.accept('-')
      this.parseArithmeticExpression()
    }
  }

  parseT () {
    this.parseF()
    this.parseT2()
  }

  parseT2 () {
    if (this.match('*')) {
      this.accept('*')
      this.parseArithmeticExpression()
    } else if (this.match('/')) {
      this.accept('/')
      this.parseArithmeticExpression()
    }
  }

  parseF () {
    if (this.match('(')) {
      this.accept('(')
      this.parseArithmeticExpression()
      if (this.match(')')) {
        this.accept(')')
        return
      }
    } else if (this.match('Number', true)) {
      this.accept('Number', true)
      return
    }
  }

  parseArithmeticIdentifier () {
    if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.accept(this.currentLexeme)
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
        this.parseIdentifierAccess()
        this.parseArithmeticExpression2()
      }
    } else if (this.match('Identifier', true)) {
      this.accept('Identifier', true)
      this.parseArithmeticIdentifier3()
    }

  }

  parseArithmeticIdentifier3 () {
    if (this.matchFirstSet(this.currentLexeme, 'identifier_access')) {
      this.parseIdentifierAccess()
      this.parseArithmeticExpression2()
    } else if (this.match('(')) {
      this.accept('(')
      this.parseParametersList()
      if (this.match(')')) {
        this.accept(')')
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
    } else if (this.match('(')) {
      this.accept('(')
      this.parseLRExpression()
      if (this.match(')')) {
        this.accept(')')
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
    if (this.match('print')) {
      this.accept('print')
      if (this.match('(')) {
        this.accept('(')
        this.parsePrintContent()
      }
    }
  }

  parsePrintContent () {
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true)) {
      this.accept(this.currentToken, true);
      this.parsePrintContinuation()
    } else if (this.matchFirstSet('scope')) {
      this.accept(this.currentLexeme);
      this.parsePrintContinuation()
    }
  }

  parsePrintContinuation () {
    if (this.match(',')) {
      this.accept(',')
      this.parsePrintContent()
    } else if(this.match(')')) {
      this.parsePrintEnd();
    }
  }

  parsePrintEnd () {
    if (this.match(')')) {
      this.accept(')')
      if (this.match(';')) {
        this.accept(';')
        return
      }
    }
  }

  parseRead () {
    if (this.match('read')) {
      this.accept('read')
      if (this.match('(')) {
        this.accept('(')
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
    if (this.match(',')) {
      this.accept(',')
      this.parseReadContent()
    } else if(this.match(')')) {
      this.readEnd();
    }
  }

  parseReadEnd () {
    if (this.match(')')) {
      this.accept(')')
      if (this.match(';')) {
        this.accept(';')
        return
      }
    }
  }
  
  parseBody () {
    if (this.match('var')) {
      this.parseVar();
      this.parseBody2();
      if (this.match('}')) {
        this.accept('}')
        console.log('fechou func');
      }
    } else if (this.match('}')) {
      this.accept('}')
      console.log('fechou func');
    }
  }

  parseBody2 () {
    if (this.matchFirstSet(this.currentLexeme, 'commands') || this.match('Identifier', true) || this.matchFirstSet(this.currentLexeme,'scope')) {
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
      if (this.match(';')) {
        this.accept(';')
        return
      }
    }
  }

  parseIdentifierCommands2 () {
    if (this.match('=')) {
      this.accept('=')
      this.parseIdentifierCommands2_1()
    } else if (this.match('(')) {
      this.accept('(')
      this.parseParametersList();
      if (this.match(')')) {
        this.accept(')')
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
    if (this.match('return')) {
      this.accept('return')
      this.parseReturnCode()
    }
  }

  parseReturnCode () {
    if (this.match(';')) {
      this.accept(';')
      return
    } else if (this.matchFirstSet('arithmetic_expression', true)
      || this.match('Number', true)
      || this.match('Identifier', true)) {

      this.parseArithmeticExpression()
      if (this.match(';')) {
        this.accept(';')
        return
      }
    }
  }
  
    /**
   * Generate Function And Procedure
   */

  parseGenerateFuncAndProc () {
    console.log(this.currentLexeme)
    if (this.match('function')) {
      this.parseFunction();
      this.parseGenerateFuncAndProc();
    } else if (this.match('procedure')) {
      this.parseProcedure();
      this.parseGenerateFuncAndProc();
    }
  }

  parseFunction () {
    if (this.match('function')) {
      this.accept('function')
      if (this.matchType()) {
        this.acceptType()
        if (this.match('Identifier', true)) {
          this.accept('Identifier', true)
          if (this.match('(')) {
            this.accept('(')
            this.parseParam();
          }
        }
      }
    }
  }

  parseProcedure () {
    console.log('abriu procedure')
    if (this.match('procedure')) {
      this.accept('procedure')
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
        this.nextToken();
        if (this.match('(')) {
          this.accept('(')
          this.nextToken();
          this.parseParam();
        }
      }
    }
  }

  parseParam () {
    if (this.matchType()) {
      this.acceptType()
      if(this.match('Identifier', true)) {
        this.accept('Identifier', true)
        this.parseParam2()
        this.parseParam1()
      }
    }
  }

  parseParam1 () {
    if (this.match(',')) {
      this.accept(',')
      this.parseParam();
    } else if (this.match(')')) {
      this.accept(')')
      this.parseF2();
    }
  }

  parseParam2 () {
    if (this.match('[')) {
      this.accept('[')
      if (this.match(']')) {
        this.accept(']')
        this.parseParam3();
      }
    }
  }

  parseParam3 () {
    if (this.match('[')) {
      this.accept('[')
      if (this.match(']')) {
        this.accept(']')
        return
      }
    }
  }

  parseF2 () {
    if (this.match('{')) {
      this.accept('{')
      console.log('abriu func');
      this.parseBody();
    }
  }

  parseStart() {
    if (this.match('start')) {
      this.accept('start')
      if (this.match('(')) {
        this.accept('(')
        if (this.match(')')) {
          this.accept(')')
          if (this.match('{')) {
            this.accept('{')
            this.parseBody()
            if (this.match('}')) {
              this.accept('}')
              return
            }
          }
        }
      }
    }
  }

  parseLoop () {
    if(this.match('while')) {
      this.accept('while')
      if (this.match('(')) {
        this.accept('(')
        this.parseLogicalRelationalExpression();
        if (this.match(')')) {
          this.accept(')')
          if (this.match('{')) {
            this.accept('{')
            this.parseBody();
            if (this.match( '}')) {
              this.accept( '}')
              console.log('fechou while')
              return
            }
          }
        }
      }
    }
  }

  parseConditional () {
    if(this.match('if')) {
      this.accept('if')
      if (this.match('(')) {
        this.accept('(')
        this.parseLogicalRelationalExpression();
        if (this.match(')')) {
          this.accept(')')
          if (this.match('then')) {
            this.accept('then')
            if (this.match('{')) {
              this.accept('{')
              this.parseBody();
              if (this.match('}')) {
                this.accept('}')
                this.parseConditionalEnd();
              }
            }
          }
        }
      }
    }
  }

  parseConditionalEnd () {
    if (this.match('else')) {
      this.accept('else')
      if (this.match('{')) {
        this.accept('{')
        this.parseBody()
        if (this.match('}')) {
          this.accept('}')
          return
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