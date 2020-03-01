const Definitions = require('./syntax_definitions');

class SyntaticalAnalyzer {

  constructor (tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.currentLineNumber = this.tokens[this.tokenPointer].line;
    this.firstSet = [];
    this.consumedTokens = [];
    this.ignoredTokens = [];
    this.errors = [];
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
      this.consumedTokens.push(this.currentLexeme)
      this.nextToken();
      return true;
    } else if (!checkToken && this.currentLexeme === expected) {
      this.consumedTokens.push(this.currentLexeme)
      this.nextToken();
      return true;
    }
    console.table([{ expected, received: this.currentLexeme, receivedToken: this.currentToken, checkToken }])
    return false;
  }

  acceptType (except = null) {
    if (this.currentLexeme == except) return false;
    if (Definitions.types.includes(this.currentLexeme)) {
      this.consumedTokens.push(this.currentLexeme)
      this.nextToken();
      return true;
    }
    return false;
  }

  acceptValue (except = null) {
    let generalGroup = ["Number", "String", "Identifier"]
    if (this.currentLexeme == except) return false;
    if ((Definitions.boolean.includes(this.currentLexeme) || generalGroup.includes(this.currentToken))) {
      this.consumedTokens.push(this.currentLexeme)
      this.nextToken();
      return true;
    }
    return false;
  }

  acceptVectorIndex () {
    if (this.currentToken == 'Identifier') {
      this.consumedTokens.push(this.currentLexeme)
      this.nextToken();
      return true;
    } else  if (this.currentToken == 'Number' && (this.currentLexeme % 1 === 0 && parseInt(this.currentLexeme) >= 0)) {
      this.consumedTokens.push(this.currentLexeme)
      this.nextToken();
      return true;
    } else {
      return false;
    }
  }

  nextToken () {
    if (this.tokenPointer + 1 < this.tokens.length) {
      this.tokenPointer++;
    }
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.currentLineNumber = this.tokens[this.tokenPointer].line;
  }

  errorHandler (expected, received, lineNumber) {
    this.errors.push({ expected, received, line: lineNumber })    
  }

  sync (tokenSync = [], lexemeSync = []) {
    let found = false;
    while (this.tokenPointer < this.tokens.length) {
      if (tokenSync.includes(this.currentLexeme) || lexemeSync.includes(this.currentLexeme)) {
        found = true;
        break;
      } else {
        this.ignoredTokens.push(this.tokens[this.tokenPointer])
        this.nextToken()
      }
    }
    return found
  }

  startAnalisys () {
    console.table(this.tokens)
    this.parseConst();
    this.parseStruct();
    this.parseVar();
    this.parseGenerateFuncAndProc()
    this.parseStart();
    console.table(this.errors)
  }

  parseConst () {
    if (this.match('const')) {
      this.accept('const')
      if (this.match ('{')) {
        this.accept ('{')
        this.parseTypeConst()
      } else {
        let tokenSync = []
        let lexemeSync = ['}', 'typedef', 'var', 'start', 'function', 'procedure']
        
        this.errorHandler('{', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          switch (this.currentLexeme) {
            case 'start':
              this.parseStart()
              break;
            case 'typedef':
              this.parseStruct()
              break;
            case 'var':
              this.parseVar()
              break;
            case 'function':
              this.parseGenerateFuncAndProc()
              break;
            case 'procedure':
              this.parseGenerateFuncAndProc()
              break;
            case '}':
              this.parseStruct()
              break;
            default:
              break;
          }
        }
      }
    } else {
      return; // <>
    }
  }

  parseTypeConst () {
    if (this.matchType()) {
      this.acceptType()
      this.parseConstExpression()
    } else {
      let tokenSync = []
      let lexemeSync = ['int', 'real', 'string', 'boolean','}', 'typedef', 'var', 'start', 'function', 'procedure']
      
      this.errorHandler('Attribute Type', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'typedef':
            this.parseStruct()
            break;
          case 'var':
            this.parseVar()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseStruct()
            break;
          case 'real':
            this.parseTypeConst()
            break;
          case 'string':
            this.parseTypeConst()
            break;
          case 'int':
            this.parseTypeConst()
            break;
          case 'boolean':
            this.parseTypeConst()
            break;
          default:
            break;
        }
      }
    }
  }

  parseConstExpression () {
    if(this.match('Identifier', true)) {
      this.accept('Identifier', true)
      if (this.matchValue()) {
        this.acceptValue()
        this.parseConstContinuation()
      } else {
        let tokenSync = ["Identifier", "String", "Number"]
        let lexemeSync = [';','}', 'typedef', 'var', 'start', 'function', 'procedure']
        
        this.errorHandler('Value to be assigned to constant', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)
  
        if (this.tokenPointer < this.tokens.length) {
          if (this.currentLexeme == 'start') {
            this.parseStart()
          } else if (this.currentLexeme == 'typedef') {
            this.parseStruct()
          } else if (this.currentLexeme == 'var') {
            this.parseVar()
          } else if (this.currentLexeme == 'function' || this.currentLexeme == 'procedure') {
            this.parseGenerateFuncAndProc()
          }
        }
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
    } else {
      let tokenSync = []
      let lexemeSync = ['int', 'real', 'string', 'boolean','}', 'typedef', 'var', 'start', 'function', 'procedure']
      
      this.errorHandler(', or ;', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'typedef':
            this.parseStruct()
            break;
          case 'var':
            this.parseVar()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseStruct()
            break;
          case 'real':
            this.parseTypeConst()
            break;
          case 'string':
            this.parseTypeConst()
            break;
          case 'int':
            this.parseTypeConst()
            break;
          case 'boolean':
            this.parseTypeConst()
            break;
          default:
            break;
        }
      }
    }
  }

  parseConstTermination () {
    if (this.match('}')) {
      this.accept('}')
    } else if (this.matchType()){
      this.parseTypeConst();
    } else {
      let tokenSync = []
      let lexemeSync = ['typedef', 'var', 'start', 'function', 'procedure']
      
      this.errorHandler('}', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        if (this.currentLexeme == 'start') {
          this.parseStart()
        } else if (this.currentLexeme == 'typedef') {
          this.parseStruct()
        } else if (this.currentLexeme == 'var') {
          this.parseVar()
        } else if (this.currentLexeme == 'function' || this.currentLexeme == 'procedure') {
          this.parseGenerateFuncAndProc()
        }
      }
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
        } else {
          let tokenSync = []
          let lexemeSync = ['}', '{', 'var', 'start', 'function', 'procedure']
          
          this.errorHandler('Identifier', this.currentLexeme, this.currentLineNumber);
          this.sync(tokenSync, lexemeSync)
    
          if (this.tokenPointer < this.tokens.length) {
            switch (this.currentLexeme) {
              case 'start':
                this.parseStart()
                break;
              case 'var':
                this.parseVar()
                break;
              case 'function':
                this.parseGenerateFuncAndProc()
                break;
              case 'procedure':
                this.parseGenerateFuncAndProc()
                break;
              case '{':
                this.parseStruct()
                break;
              case '}':
                this.parseVar()
                break;
              default:
                break;
            }
          }
        }
      } else {
        let tokenSync = []
        let lexemeSync = ['{', 'var', 'start', 'function', 'procedure']
        
        this.errorHandler('struct', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)
  
        if (this.tokenPointer < this.tokens.length) {
          switch (this.currentLexeme) {
            case 'start':
              this.parseStart()
              break;
            case 'var':
              this.parseVar()
              break;
            case 'function':
              this.parseGenerateFuncAndProc()
              break;
            case 'procedure':
              this.parseGenerateFuncAndProc()
              break;
            case '{':
              this.parseStruct()
              break;
            default:
              break;
          }
        }
      }
    } else {
      return; // <>
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
    } else {
      let tokenSync = []
      let lexemeSync = ['}', 'var', 'start', 'function', 'procedure']
      
      this.errorHandler('{', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'var':
            this.parseVar()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseVar()
            break;
          default:
            break;
        }
      }
    }
  }

  parseTypeStruct () {
    if (this.matchType()) {
      this.acceptType()
      this.parseStructExpression()
    } else {
      let tokenSync = []
      let lexemeSync = ['int', 'real', 'string', 'boolean','}', 'var', 'start', 'function', 'procedure']
      
      this.errorHandler('Attribute Type', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'var':
            this.parseVar()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseStruct()
            break;
          case 'real':
            this.parseTypeStruct()
            break;
          case 'string':
            this.parseTypeStruct()
            break;
          case 'int':
            this.parseTypeStruct()
            break;
          case 'boolean':
            this.parseTypeStruct()
            break;
          default:
            break;
        }
      }
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
    } else {
      let tokenSync = []
      let lexemeSync = ['int', 'real', 'string', 'boolean','}', 'var', 'start', 'function', 'procedure']
      
      this.errorHandler(', or ;', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'var':
            this.parseVar()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseStruct()
            break;
          case 'real':
            this.parseTypeStruct()
            break;
          case 'string':
            this.parseTypeStruct()
            break;
          case 'int':
            this.parseTypeStruct()
            break;
          case 'boolean':
            this.parseTypeStruct()
            break;
          default:
            break;
        }
      }
    }
  }

  parseStructTermination () {
    if (this.match('}')) {
      this.accept('}')
      return;
    } else if (this.matchType) {
      this.parseTypeStruct();
    } else {
      let tokenSync = []
      let lexemeSync = ['var', 'start', 'function', 'procedure']
      
      this.errorHandler('}', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        if (this.currentLexeme == 'start') {
          this.parseStart()
        } else if (this.currentLexeme == 'var') {
          this.parseVar()
        } else if (this.currentLexeme == 'function' || this.currentLexeme == 'procedure') {
          this.parseGenerateFuncAndProc()
        }
      }
    }
  }

  // Relative to Var
  parseVar () {
    if (this.match('var')) {
      this.accept('var')
      if (this.match ('{')) {
        this.accept ('{')
        this.parseTypeVar()
      } else {
        let tokenSync = []
        let lexemeSync = ['}', 'start', 'function', 'procedure']
        
        this.errorHandler('{', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          switch (this.currentLexeme) {
            case 'start':
              this.parseStart()
              break;
            case 'function':
              this.parseGenerateFuncAndProc()
              break;
            case 'procedure':
              this.parseGenerateFuncAndProc()
              break;
            case '}':
              this.parseGenerateFuncAndProc()
              break;
            default:
              break;
          }
        }
      }
    } else {
      return; // <>
    }
  }

  // Relative to TipoVar
  parseTypeVar () {
    if (this.matchType()) {
      this.acceptType()
      this.parseVarExpression()
    } else {
      let tokenSync = []
      let lexemeSync = ['int', 'real', 'string', 'boolean', 'start', 'function', 'procedure']
      
      this.errorHandler('Attribute Type', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'var':
            this.parseVar()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseGenerateFuncAndProc()
            break;
          case 'real':
            this.parseTypeVar()
            break;
          case 'string':
            this.parseTypeVar()
            break;
          case 'int':
            this.parseTypeVar()
            break;
          case 'boolean':
            this.parseTypeVar()
            break;
          default:
            break;
        }
      }
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
      } else {
        let tokenSync = []
        let lexemeSync = ['int', 'real', 'boolean', 'string', ';', '}', 'start', 'function', 'procedure']
        
        this.errorHandler('Value to be assigned', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          switch (this.currentLexeme) {
            case 'start':
              this.parseStart()
              break;
            case 'function':
              this.parseGenerateFuncAndProc()
              break;
            case 'procedure':
              this.parseGenerateFuncAndProc()
              break;
            case '}':
              this.parseGenerateFuncAndProc()
              break;
            case ';':
              this.parseVarContinuation()
              break;
            case 'int':
              this.parseTypeVar()
              break;
            case 'real':
              this.parseTypeVar()
              break;
            case 'boolean':
              this.parseTypeVar()
              break;
            case 'string':
              this.parseTypeVar()
              break;
            default:
              break;
          }
        }
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
    } else {
      let tokenSync = []
      let lexemeSync = ['int', 'real', 'string', 'boolean', 'start', 'function', 'procedure']
      
      this.errorHandler(', or ;', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        switch (this.currentLexeme) {
          case 'start':
            this.parseStart()
            break;
          case 'function':
            this.parseGenerateFuncAndProc()
            break;
          case 'procedure':
            this.parseGenerateFuncAndProc()
            break;
          case '}':
            this.parseGenerateFuncAndProc()
            break;
          case 'real':
            this.parseTypeVar()
            break;
          case 'string':
            this.parseTypeVar()
            break;
          case 'int':
            this.parseTypeVar()
            break;
          case 'boolean':
            this.parseTypeVar()
            break;
          default:
            break;
        }
      }
    }
  }

  // Relative to Var3
  parseVarTermination () {
    if (this.match('}')) {
      this.accept('}')
      return;
    } else if (this.matchType()){
      this.parseTypeVar();
    } else {
      let tokenSync = []
      let lexemeSync = ['start', 'function', 'procedure']
      
      this.errorHandler('}', this.currentLexeme, this.currentLineNumber);
      this.sync(tokenSync, lexemeSync)

      if (this.tokenPointer < this.tokens.length) {
        if (this.currentLexeme == 'start') {
          this.parseStart()
        } else if (this.currentLexeme == 'function' || this.currentLexeme == 'procedure') {
          this.parseGenerateFuncAndProc()
        }
      }
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
        } else {
          let tokenSync = []
          let lexemeSync = ['int', 'real', 'boolean', 'string', ';', '}', 'start', 'function', 'procedure']
          
          this.errorHandler(']', this.currentLexeme, this.currentLineNumber);
          this.sync(tokenSync, lexemeSync)

          if (this.tokenPointer < this.tokens.length) {
            switch (this.currentLexeme) {
              case 'start':
                this.parseStart()
                break;
              case 'function':
                this.parseGenerateFuncAndProc()
                break;
              case 'procedure':
                this.parseGenerateFuncAndProc()
                break;
              case '}':
                this.parseGenerateFuncAndProc()
                break;
              case ';':
                this.parseVarContinuation()
                break;
              case 'int':
                this.parseTypeVar()
                break;
              case 'real':
                this.parseTypeVar()
                break;
              case 'boolean':
                this.parseTypeVar()
                break;
              case 'string':
                this.parseTypeVar()
                break;
              default:
                break;
            }
          }
        }
      } else {
        let tokenSync = []
        let lexemeSync = ['int', 'real', 'boolean', 'string', ';', '}', 'start', 'function', 'procedure']
        
        this.errorHandler('Value to be array index', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          switch (this.currentLexeme) {
            case 'start':
              this.parseStart()
              break;
            case 'function':
              this.parseGenerateFuncAndProc()
              break;
            case 'procedure':
              this.parseGenerateFuncAndProc()
              break;
            case '}':
              this.parseGenerateFuncAndProc()
              break;
            case ';':
              this.parseVarContinuation()
              break;
            case 'int':
              this.parseTypeVar()
              break;
            case 'real':
              this.parseTypeVar()
              break;
            case 'boolean':
              this.parseTypeVar()
              break;
            case 'string':
              this.parseTypeVar()
              break;
            default:
              break;
          }
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
        } else {
          let tokenSync = []
          let lexemeSync = ['int', 'real', 'boolean', 'string', ';', '}', 'start', 'function', 'procedure']
          
          this.errorHandler(']', this.currentLexeme, this.currentLineNumber);
          this.sync(tokenSync, lexemeSync)

          if (this.tokenPointer < this.tokens.length) {
            switch (this.currentLexeme) {
              case 'start':
                this.parseStart()
                break;
              case 'function':
                this.parseGenerateFuncAndProc()
                break;
              case 'procedure':
                this.parseGenerateFuncAndProc()
                break;
              case '}':
                this.parseGenerateFuncAndProc()
                break;
              case ';':
                this.parseVarContinuation()
                break;
              case 'int':
                this.parseTypeVar()
                break;
              case 'real':
                this.parseTypeVar()
                break;
              case 'boolean':
                this.parseTypeVar()
                break;
              case 'string':
                this.parseTypeVar()
                break;
              default:
                break;
            }
          }
        }
      } else {
        let tokenSync = []
        let lexemeSync = ['int', 'real', 'boolean', 'string', ';', '}', 'start', 'function', 'procedure']
        
        this.errorHandler('Value to be array index', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          switch (this.currentLexeme) {
            case 'start':
              this.parseStart()
              break;
            case 'function':
              this.parseGenerateFuncAndProc()
              break;
            case 'procedure':
              this.parseGenerateFuncAndProc()
              break;
            case '}':
              this.parseGenerateFuncAndProc()
              break;
            case ';':
              this.parseVarContinuation()
              break;
            case 'int':
              this.parseTypeVar()
              break;
            case 'real':
              this.parseTypeVar()
              break;
            case 'boolean':
              this.parseTypeVar()
              break;
            case 'string':
              this.parseTypeVar()
              break;
            default:
              break;
          }
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
      } else {
          let tokenSync = ['Identifier']
          let lexemeSync = ['}', 'start'].concat(this.firstSet['commands'])
          
          this.errorHandler('(', this.currentLexeme, this.currentLineNumber);
          this.sync(tokenSync, lexemeSync)

          if (this.tokenPointer < this.tokens.length) {
            if (this.matchFirstSet(this.currentLexeme, 'commands')) {
              this.parseCommands()
            } else if (this.currentLexeme == 'start') {
              this.parseStart()
            }
          }
      }
    }
  }

  parsePrintContent () {
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true)) {
      this.accept(this.currentToken, true);
      this.parsePrintContinuation()
    } else if (this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.accept(this.currentLexeme);
      this.parsePrintContinuation()
    } else {
        let tokenSync = ['Identifier']
        let lexemeSync = ['}', 'start'].concat(this.firstSet['commands'])
        
        this.errorHandler('Identifier, String, Number or Function', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          if (this.matchFirstSet(this.currentLexeme, 'commands')) {
            this.parseCommands()
          } else if (this.currentLexeme == 'start') {
            this.parseStart()
          }
        }
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
      } else {
        let tokenSync = ['Identifier']
        let lexemeSync = ['}', 'start'].concat(this.firstSet['commands'])
        
        this.errorHandler(';', this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync)

        if (this.tokenPointer < this.tokens.length) {
          if (this.matchFirstSet(this.currentLexeme, 'commands')) {
            this.parseCommands()
          } else if (this.currentLexeme == 'start') {
            this.parseStart()
          }
        }
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
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true) || this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.parseIdentifierWithoutFunction()
      this.parseReadContinuation()
    }
  }

  parseReadContinuation () {
    if (this.match(',')) {
      this.accept(',')
      this.parseReadContent()
    } else if(this.match(')')) {
      this.parseReadEnd();
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
    }
    this.parseBody2();
    if (this.match('}')) {
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
    } else if (this.match('Identifier', true) || this.matchFirstSet(this.currentLexeme, 'scope')) {
      this.parseIdentifierCommands()
    }
  }
  
  parseIdentifierCommands () {
    if (this.match('String', true) || this.match('Number') || this.match('Identifier', true) || this.matchFirstSet(this.currentLexeme, 'scope')) {
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
    } else if (this.matchFirstSet(this.currentLexeme, 'arithmetic_expression')
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
    if (this.match('procedure')) {
      this.accept('procedure')
      if (this.match('Identifier', true)) {
        this.accept('Identifier', true)
        if (this.match('(')) {
          this.accept('(')
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