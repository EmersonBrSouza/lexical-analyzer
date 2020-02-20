class SyntaticalAnalyzer {
  constructor (tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.errors = [];

    this.definitions = {
      types: ["int", "real"],
      boolean: ["false", "true"]
    }
  }


  start () {
    console.log(this.tokens);
    this.const();    
  }

  nextToken () {
    this.tokenPointer++;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
  }

  const () {
    if (this.currentLexeme == 'const') {
      this.nextToken();
      if (this.currentLexeme == '{') {
        this.nextToken();
        this.type_const();
      }
    }
  }

  type_const () {
    if (this.definitions.types.includes(this.currentLexeme)) {
      this.nextToken();
      this.id_const();
    }
  }

  id_const () {
    if (this.currentToken == 'Identifier') {
      console.log('Validou tipo')
      this.nextToken();
      this.value();
    }
  }

  value () {
    if (['String', 'Number', 'Identifier'].includes(this.currentToken) || this.definitions.boolean.includes(this.currentLexeme)) {
      this.nextToken();
      console.log('Validou Valor')
    } else {
      console.log('Erro ao validar valor')
    }
  }
}

module.exports = SyntaticalAnalyzer