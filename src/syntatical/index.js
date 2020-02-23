const Definitions = require('./syntax_definitions');

class SyntaticalAnalyzer {
  constructor (tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    if (this.tokenPointer < this.tokens.length) {
      this.currentToken = this.tokens[this.tokenPointer].token;
      this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    }
    this.errors = [];
  }


  start () {
    console.log(this.tokens);
    this.const();
    this.struct();
    this.var();
    this.generateFunctionAndProcedure();
  }

  nextToken () {
    this.tokenPointer++;
    if (this.tokenPointer < this.tokens.length) {
      this.currentToken = this.tokens[this.tokenPointer].token;
      this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    }
  }

  /** General Use */
  value () {
    let generalGroup = ["Number", "String", "Identifier"]
    return (Definitions.boolean.includes(this.currentLexeme) || generalGroup.includes(this.currentToken))
  }

  valueVector () {
    if (this.currentToken == 'Identifier') {
      return true;
    } else  if (this.currentToken == 'Number') {
      return this.currentLexeme % 1 === 0 && parseInt(this.currentLexeme) >= 0;
    } else {
      return false;
    }
  }

  /**
   * Const Methods
   */
  const () {
    if (this.currentLexeme == 'const') {
      this.nextToken();
      if(this.currentLexeme == '{') {
        this.nextToken();
        this.typeConst();
      }
    } else {
      return;
    }
  }

  typeConst () {
    if (Definitions.types.includes(this.currentLexeme)) {
      this.nextToken();
      this.idConst();
    }
  }

  idConst () {
    if (this.currentToken == 'Identifier') {
      this.nextToken();
      if(this.value()) {
        this.nextToken();
        this.const2();
      }
    }
  }
  
  const2 () {
    if (this.currentLexeme == ',') {
      this.nextToken();
      this.idConst();
    } else if (this.currentLexeme == ';') {
      this.nextToken();
      this.const3();
    }
  }

  const3 () {
    
    if (this.currentLexeme == '}') {
      this.nextToken();
      console.log('fechou const')
    } else {
      this.typeConst();
    }
  }

  /**
   * Struct Methods
   */
  struct () {
    if (this.currentLexeme == 'typedef') {
      this.nextToken();
      if (this.currentLexeme == 'struct') {
        this.nextToken();
        if (this.currentToken == 'Identifier') {
          this.nextToken();
          this.extends();
        }
      }
    } else {
      return;
    }
  }

  extends () {
    if (this.currentLexeme == 'extends') {
      this.nextToken();
      if (this.currentToken == 'Identifier') {
        this.nextToken();
        if (this.currentLexeme == '{') {
          this.nextToken();
          this.typeStruct();
        }
      }
    } else if (this.currentLexeme == '{') {
      this.nextToken();
      this.typeStruct();
    }
  }

  typeStruct () {
    if (Definitions.types.includes(this.currentLexeme)) {
      this.nextToken()
      this.idStruct()
    }
  }

  idStruct () {
    if (this.currentToken == 'Identifier') {
      this.nextToken();
      this.struct2();
    }
  }

  struct2 () {
    if (this.currentLexeme == ',') {
      this.nextToken();
      this.idStruct();
    } else if (this.currentLexeme == ';') {
      this.nextToken();
      this.struct3();
    }
  }

  struct3 () {
    if (this.currentLexeme == '}') {
      this.nextToken();
      console.log('fechou struct')
    } else {
      this.typeStruct();
    }
  }
  /**
   * Var Methods
   */

  var () {
    if (this.currentLexeme == 'var') {
      this.nextToken();
      if(this.currentLexeme == '{') {
        this.nextToken();
        this.typeVar();
      }
    }
  }

  typeVar () {
    if (Definitions.types.includes(this.currentLexeme)) {
      this.nextToken()
      this.idVar()
    }
  }

  idVar () {
    if (this.currentToken == 'Identifier') {
      this.nextToken();
      this.var2();
    }
  }

  var2 () {
    if (this.currentLexeme == ',') {
      this.nextToken();
      this.idVar();
    } else if (this.currentLexeme == ';') {
      this.nextToken();
      this.var3();
    } else if (this.currentLexeme == '=') {
      this.nextToken();
      if (this.value()) {
        this.nextToken();
        this.var4();
      }
    } else if (this.currentLexeme == '[') {
      this.vector();
    }
  }

  var3 () {
    if (this.currentLexeme == '}') {
      this.nextToken();
      console.log('fechou var');
      
    } else {
      this.typeVar();
    }
  }

  var4 () {
    if (this.currentLexeme == ',') {
      this.nextToken();
      this.idVar();
    } else if (this.currentLexeme == ';') {
      this.nextToken();
      this.var3();
    }
  }

  vector () {
    if (this.currentLexeme == '[') {
      this.nextToken();
      if(this.valueVector()) {
        this.nextToken();
        if (this.currentLexeme == ']') {
          this.nextToken();
          this.matrix();
        }
      }
    }
  }

  matrix () {
    if (this.currentLexeme == '[') {
      this.nextToken();
      if(this.valueVector()) {
        this.nextToken();
        if (this.currentLexeme == ']') {
          this.nextToken();
          this.var4();
        }
      }
    } else {
      this.var4();
    }
  }

  /**
   * Generate Function And Procedure
   */

  generateFunctionAndProcedure () {
    if (this.currentLexeme == 'function') {
      this.func();
      this.generateFunctionAndProcedure();
    } else if (this.currentLexeme == 'procedure') {
      this.procedure();
      this.generateFunctionAndProcedure();
    }
  }

  func () {
    if (this.currentLexeme == 'function') {
      this.nextToken();
      if (Definitions.types.includes(this.currentLexeme)) {
        this.nextToken();
        if (this.currentToken == 'Identifier') {
          this.nextToken();
          if (this.currentLexeme == '(') {
            this.nextToken();
            this.param();
          }
        }
      }
    }
  }

  procedure () {
    if (this.currentLexeme == 'procedure') {
      this.nextToken();
      if (this.currentToken == 'Identifier') {
        this.nextToken();
        if (this.currentLexeme == '(') {
          this.nextToken();
          this.param();
        }
      }
    }
  }

  param () {
    if (Definitions.types.includes(this.currentLexeme)) {
      this.nextToken()
      if(this.currentToken == 'Identifier') {
        this.nextToken()
        this.param2()
        this.param1()
      }
    }
  }

  param1 () {
    if (this.currentLexeme == ',') {
      this.nextToken();
      this.param();
    } else if (this.currentLexeme == ')') {
      this.nextToken();
      this.f2();
    }
  }

  param2 () {
    if (this.currentLexeme == '[') {
      this.nextToken();
      if (this.currentLexeme == ']') {
        this.nextToken();
        this.param3();
      }
    }
  }

  param3 () {
    if (this.currentLexeme == '[') {
      this.nextToken();
      if (this.currentLexeme == ']') {
        this.nextToken();
      }
    }
  }

  f2 () {
    
    if (this.currentLexeme == '{') {
      console.log('abriu func');
      this.nextToken();
      this.body();
    }
  }

  body () {
    if (this.currentLexeme == 'var') {
      this.var();
      this.body2();
      if (this.currentLexeme == '}') {
        console.log('fechou func');
      }
    } else if ('}') {
      this.nextToken();
      console.log('fechou func');
    }
  }

  body2 () {
    if (Definitions.commands.includes(this.currentLexeme)) {
      this.commands();
    }
    //<IdentificadorComandos>
  }

  commands () {
    if (this.currentLexeme == 'while') {
      this.loop();
    } else if (this.currentLexeme == 'if') {
      this.conditional();
    } else if (this.currentLexeme == 'read') {
      this.read();
    } else if (this.currentLexeme == 'print') {
      this.print();
    }
  }

  loop () {
    if(this.currentLexeme == 'while') {
      this.nextToken();
      if (this.currentLexeme == '(') {
        this.expressionLogicRelational();
        if (this.currentLexeme == ')') {
          this.nextToken();
          if (this.currentLexeme == '{') {
            this.nextToken();
            this.body();
            this.nextToken();
            if (this.currentLexeme == '}') {

            }
          }
        }
      }
    }
  }

  conditional () {
    console.log('while');
  }

  read () {
    console.log('while');
  }

  print () {
    console.log('while');
  }

}

module.exports = SyntaticalAnalyzer