const Definitions = require("./syntax_definitions");

class SyntaticalAnalyzer {
  constructor(tokens) {
    this.tokens = tokens;
    this.tokenPointer = 0;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLine = this.tokens[this.tokenPointer].line;
    this.firstSet = [];
    this.errors = [];
    this.mountFirstSets();
  }

  eof() {
    return this.tokenPointer == this.tokens.length;
  }

  check(lexeme, searchByType) {
    if (searchByType) {
      if (lexeme == this.currentToken) {
        return true;
      } else {
        return false;
      }
    } else {
      if (lexeme == this.currentLexeme) {
        return true;
      } else {
        return false;
      }
    }
  }

  checkType() {
    return Definitions.types.includes(this.currentLexeme);
  }

  checkValue() {
    let generalGroup = ["Number", "String", "Identifier"];
    return (
      Definitions.boolean.includes(this.currentLexeme) ||
      generalGroup.includes(this.currentToken)
    );
  }

  checkVectorIndex() {
    if (this.currentToken == "Identifier") {
      return true;
    } else if (
      this.currentToken == "Number" &&
      this.currentLexeme % 1 === 0 &&
      parseInt(this.currentLexeme) >= 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  consume(lexeme, searchByType = false) {
    if (this.check(lexeme, searchByType)) {
      this.nextToken();
      return true;
    } else {
      return false;
    }
  }

  consumeType() {
    if (this.checkType()) {
      this.consume(this.currentLexeme);
      return true;
    } else {
      return false;
    }
  }

  consumeValue() {
    if (this.checkValue()) {
      this.consume(this.currentLexeme);
      return true;
    } else {
      return false;
    }
  }

  consumeVectorIndex() {
    if (this.checkVectorIndex()) {
      this.consume(this.currentLexeme);
      return true;
    } else {
      return false;
    }
  }

  nextToken() {
    if (this.tokenPointer + 1 > this.tokens.length) return;
    this.tokenPointer++;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLine = this.tokens[this.tokenPointer].line;
    console.log(this.currentLexeme);
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

  handleError(expected, received, line) {
    console.log(
      `Esperava '${expected}' mas recebeu '${received}' na linha ${line}`
    );
  }

  sync(followSet) {
    let found = false;
    while (this.tokenPointer < this.tokens.length) {
      if (
        followSet.tokens.includes(this.currentToken) ||
        followSet.lexemes.includes(this.currentLexeme)
      ) {
        found = true;
        break;
      } else {
        this.nextToken();
      }
    }
    return found;
  }

  startAnalisys() {
    console.table(this.tokens);
    this.parseConst();
    this.parseStruct();
    this.parseVar();
    this.parseGenerateFuncAndProc();
  }

  parseConst() {
    if (this.consume("const")) {
      if (this.consume("{")) {
        this.parseTypeConst();
      } else {
        this.handleError("{", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("const"));
        switch (this.currentLexeme) {
          case "typedef": this.parseStruct(); break;
          case "var": this.parseVar(); break;
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
        }
      }
    }
  }

  parseTypeConst() {
    if (this.consumeType(this.currentLexeme)) {
      this.parseConstExpression();
    } else {
      this.handleError("Const Type", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("const"));
      switch (this.currentLexeme) {
        case "typedef": this.parseStruct(); break;
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
      }
    }
  }

  parseConstExpression() {
    if (this.consume("Identifier", true)) {
      if (this.consumeValue(this.currentLexeme)) {
        this.parseConstContinuation();
      } else {
        this.handleError("Const value to be assigned", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("const"));
        switch (this.currentLexeme) {
          case "typedef": this.parseStruct(); break;
          case "var": this.parseVar(); break;
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
        }
      }
    } else {
      this.handleError("Const Identifier", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("const"));
      switch (this.currentLexeme) {
        case "typedef": this.parseStruct(); break;
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
      }
    }
  }

  parseConstContinuation() {
    if (this.consume(",")) {
      this.parseConstExpression();
    } else if (this.consume(";")) {
      this.parseConstTermination();
    }
  }

  parseConstTermination() {
    if (this.consume("}")) {
      return;
    } else if (this.checkType()) {
      this.parseTypeConst();
    }
  }

  parseStruct() {
    if (this.consume("typedef")) {
      if (this.consume("struct")) {
        if (this.consume("Identifier", true)) {
          this.parseStructExtends();
        }
      }
    }
  }

  parseStructExtends() {
    if (this.consume("extends")) {
      if (this.consume("{")) {
        this.parseTypeStruct();
      }
    } else if (this.consume("{")) {
      this.parseTypeStruct();
    }
  }

  parseTypeStruct() {
    if (this.consumeType()) {
      this.parseStructExpression();
    }
  }

  parseStructExpression() {
    if (this.consume("Identifier", true)) {
      this.parseStructContinuation();
    }
  }

  parseStructContinuation() {
    if (this.consume(",")) {
      this.parseStructExpression();
    } else if (this.consume(";")) {
      this.parseStructTermination();
    }
  }

  parseStructTermination() {
    if (this.consume("}")) {
      return;
    } else if (this.checkType()) {
      this.parseTypeStruct();
    }
  }

  parseVar() {
    if (this.consume("var")) {
      if (this.consume("{")) {
        this.parseTypeVar();
      }
    }
  }

  parseTypeVar() {
    if (this.consumeType()) {
      this.parseVarExpression();
    }
  }

  parseVarExpression() {
    if (this.consume("Identifier", true)) {
      this.parseVarContinuation();
    }
  }

  parseVarContinuation() {
    if (this.consume(",")) {
      this.parseVarExpression();
    } else if (this.consume(";")) {
      this.parseVarTermination();
    } else if (this.check("[")) {
      this.parseVector();
    } else if (this.consume("=")) {
      if (this.consumeValue()) {
        this.parseVarAttribuition();
      }
    }
  }

  parseVarAttribuition() {
    if (this.consume(",")) {
      this.parseVarExpression();
    } else if (this.consume(";")) {
      this.parseVarTermination();
    }
  }

  parseVarTermination() {
    if (this.consume("}")) {
      return;
    } else if (this.checkType()) {
      this.parseTypeVar();
    }
  }

  parseVector() {
    if (this.consume("[")) {
      if (this.consumeVectorIndex()) {
        if (this.consume("]")) {
          this.parseMatrix();
        }
      }
    }
  }

  parseMatrix() {
    if (this.consume("[")) {
      if (this.consumeVectorIndex()) {
        if (this.consume("]")) {
          this.parseVarAttribuition();
        }
      }
    } else {
      this.parseVarAttribuition();
    }
  }

  // Relative to ListaParametros
  parseParametersList() {
    if (
      this.matchFirstSet(this.currentLexeme, "scope") ||
      this.consume("Number", true) ||
      this.consume("String", true)
    ) {
      this.parseParametersListEnd();
      this.parseParametersListContinuation();
    }
  }

  // Relative to ContListaParametros
  parseParametersListContinuation() {
    if (this.consume(",")) {
      this.parseParametersList();
    }
  }

  // Relative to ListaParametros2
  parseParametersListEnd() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
    } else if (this.consume("Number", true) || this.consume("String", true)) {
    }
  }

  parseIdentifier() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
      this.parseScope();
      if (this.consume("Identifier", true)) {
        this.parseIdentifierAccess();
      }
    } else if (this.consume("Identifier", true)) {
      this.parseIdentifierAppendix();
    }
  }

  parseIdentifierAppendix() {
    if (this.matchFirstSet(this.currentLexeme, "identifier_access")) {
      this.parseIdentifierAccess();
    } else if ("a") {
      this.parseParametersList();
      if ("a") {
        return;
      }
    }
  }

  // Relative to Identificador2
  parseIdentifierAccess() {
    if (this.consume(".")) {
      if (this.consume("Identifier", true)) {
        this.parseVectorDeclaration();
      }
    } else if (this.consume("[")) {
      this.parseVectorDeclaration();
    } else {
      // Se for vazio
      this.nextToken();
    }
  }

  parseVectorDeclaration() {
    if (this.consume("[")) {
      if (this.consumeVectorIndex()) {
        if (this.consume("]")) {
          this.parseVectorNewDimension();
          this.parseVectorAccess();
        }
      }
    } else if (this.consume(".")) {
      this.parseVectorAccess();
    }
  }

  // Relative to Vetor2
  parseVectorNewDimension() {
    if (this.consume("[")) {
      if (this.consumeVectorIndex()) {
        if (this.consume("]")) {
          this.parseVectorNewDimension();
          this.parseVectorAccess();
        }
      }
    }
  }

  // Relative to Identificador 4
  parseVectorAccess() {
    if (this.consume(".")) {
      if (this.consume("Identifier", true)) {
        this.parseVectorDeclaration();
      }
    }
  }

  parseScope() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
      if (this.consume(this.currentLexeme)) {
        if (this.consume(".")) {
          return;
        }
      }
    }
  }

  parseIdentifierWithoutFunction() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
      this.consume(this.currentLexeme)
      if (this.consume("Identifier", true)) {
        this.parseIdentifierAccess();
      }
    } else if (this.check("Identifier", true)) {
      this.parseIdentifierAccess();
    }
  }

  parseArithmeticExpression() {
    if (this.check("(") || this.check("Number", true)) {
      this.parseT();
      this.parseE2();
    } else if (
      this.matchFirstSet(this.currentLexeme, "scope") ||
      this.check("Identifier", true)
    ) {
      this.parseArithmeticIdentifier();
    } else if (this.consume("++")) {
      this.parseIdentifierWithoutFunction();
      this.parseT2();
      this.parseE2();
    } else if (this.consume("--")) {
      this.parseIdentifierWithoutFunction();
      this.parseT2();
      this.parseE2();
    }
  }

  parseArithmeticExpression2() {
    if (this.consume("++")) {
      this.parseE2();
    } else if (this.consume("--")) {
      this.parseE2();
    } else if (this.matchFirstSet(this.currentLexeme, "t2")) {
      this.parseE2();
    }
  }

  parseE2() {
    if (this.consume("+")) {
      this.parseArithmeticExpression();
    } else if (this.consume("-")) {
      this.parseArithmeticExpression();
    }
  }

  parseT() {
    this.parseF();
    this.parseT2();
  }

  parseT2() {
    if (this.consume("*")) {
      this.parseArithmeticExpression();
    } else if (this.consume("/")) {
      this.parseArithmeticExpression();
    }
  }

  parseF() {
    if (this.consume("(")) {
      this.parseArithmeticExpression();
      if (this.consume(")")) {
        return;
      }
    } else if (this.consume("Number", true)) {
      return;
    }
  }

  parseArithmeticIdentifier() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
      if (this.consume("Identifier", true)) {
        this.parseIdentifierAccess();
        this.parseArithmeticExpression2();
      }
    } else if (this.consume("Identifier", true)) {
      this.parseArithmeticIdentifier3();
    }
  }

  parseArithmeticIdentifier3() {
    if (this.matchFirstSet(this.currentLexeme, "identifier_access")) {
      this.parseIdentifierAccess();
      this.parseArithmeticExpression2();
    } else if (this.consume("(")) {
      this.parseParametersList();
      if (this.consume(")")) {
        this.parseT2();
        this.parseE2();
      }
    }
  }

  parseLogicalRelationalExpression() {
    if (
      this.check("!") ||
      this.isBoolean(this.currentLexeme) ||
      this.check("String", true) ||
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.check("Number", true) ||
      this.check("Identifier", true)
    ) {
      this.parseLRExpression();
    } else if (this.check("(")) {
      this.parseLRExpression();
      if (this.check(")")) {
        this.parseLRExpression3();
      }
    }
  }

  parseLRExpression() {
    if (this.check("!") || this.isBoolean(this.currentLexeme)) {
      this.parseLRArgument2();
      this.parseLRExpression2();
    } else if (
      this.check("String", true) ||
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.check("Number", true) ||
      this.check("Identifier", true)
    ) {
      this.parseLRArgument3();
      if (this.isRelationalOperator(this.currentLexeme)) {
        this.consume(this.currentLexeme)
        this.parseLRArgument();
        this.parseLRExpression3();
      }
    }
  }

  parseLRExpression2() {
    if (this.isRelationalOperator(this.currentLexeme)) {
      this.parseLRArgument();
      this.parseLRExpression3();
    } else if (this.isLogicalOperator(this.currentLexeme)) {
      this.parseLRExpression3();
    }
  }

  parseLRExpression3() {
    if (this.isLogicalOperator(this.currentLexeme)) {
      this.parseLogicalRelationalExpression();
    }
  }

  parseLRArgument() {
    if (this.check("!") || this.isBoolean(this.currentLexeme)) {
      this.parseLRArgument2();
    } else if (
      this.check("String", true) ||
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.check("Number", true) ||
      this.check("Identifier", true)
    ) {
      this.parseLRArgument3();
    }
  }

  parseLRArgument2() {
    if (this.check("!") || this.isBoolean(this.currentLexeme)) {
      this.consume(this.currentLexeme);
    }
  }

  parseLRArgument2_1() {
    if (this.consume("Identifier", true)) {
      return;
    } else if (this.isBoolean(this.currentLexeme)) {
      this.consume(this.currentLexeme)
    }
  }

  parseLRArgument3() {
    if (this.consume("String", true)) {
      return;
    } else if (
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.check("Number", true) ||
      this.check("Identifier", true)
    ) {
      this.parseArithmeticExpression();
    }
  }

  parsePrint() {
    if (this.consume("print")) {
      if (this.consume("(")) {
        this.parsePrintContent();
      } else {
        let tokenSync = ["Identifier"];
        let lexemeSync = ["}", "start"].concat(this.firstSet["commands"]);

        this.errorHandler("(", this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync);

        if (this.tokenPointer < this.tokens.length) {
          if (this.matchFirstSet(this.currentLexeme, "commands")) {
            this.parseCommands();
          } else if (this.currentLexeme == "start") {
            this.parseStart();
          }
        }
      }
    }
  }

  parsePrintContent() {
    if (
      this.check("String", true) ||
      this.check("Number") ||
      this.check("Identifier", true)
    ) {
      this.consume(this.currentLexeme)
      this.parsePrintContinuation();
    } else if (this.matchFirstSet(this.currentLexeme, "scope")) {
      this.parsePrintContinuation();
    } else {
      let tokenSync = ["Identifier"];
      let lexemeSync = ["}", "start"].concat(this.firstSet["commands"]);

      this.errorHandler(
        "Identifier, String, Number or Function",
        this.currentLexeme,
        this.currentLineNumber
      );
      this.sync(tokenSync, lexemeSync);

      if (this.tokenPointer < this.tokens.length) {
        if (this.matchFirstSet(this.currentLexeme, "commands")) {
          this.parseCommands();
        } else if (this.currentLexeme == "start") {
          this.parseStart();
        }
      }
    }
  }

  parsePrintContinuation() {
    if (this.consume(",")) {
      this.parsePrintContent();
    } else if (this.check(")")) {
      this.parsePrintEnd();
    }
  }

  parsePrintEnd() {
    if (this.consume(")")) {
      if (this.consume(";")) {
        return;
      } else {
        let tokenSync = ["Identifier"];
        let lexemeSync = ["}", "start"].concat(this.firstSet["commands"]);

        this.errorHandler(";", this.currentLexeme, this.currentLineNumber);
        this.sync(tokenSync, lexemeSync);

        if (this.tokenPointer < this.tokens.length) {
          if (this.matchFirstSet(this.currentLexeme, "commands")) {
            this.parseCommands();
          } else if (this.currentLexeme == "start") {
            this.parseStart();
          }
        }
      }
    }
  }

  parseRead() {
    if (this.consume("read")) {
      if (this.consume("(")) {
        this.parseReadContent();
      }
    }
  }

  parseReadContent() {
    if (
      this.check("String", true) ||
      this.check("Number") ||
      this.check("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseIdentifierWithoutFunction();
      this.parseReadContinuation();
    }
  }

  parseReadContinuation() {
    if (this.consume(",")) {
      this.parseReadContent();
    } else if (this.check(")")) {
      this.parseReadEnd();
    }
  }

  parseReadEnd() {
    if (this.consume(")")) {
      if (this.consume(";")) {
        return;
      }
    }
  }

  parseBody() {
    if (this.check("var")) {
      this.parseVar();
    }
    this.parseBody2();
    if (this.consume("}")) {
      console.log("fechou func");
    }
  }

  parseBody2() {
    if (
      this.matchFirstSet(this.currentLexeme, "commands") ||
      this.check("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseCommands();
      this.parseBody2();
      if (this.consume("}")) {
        console.log("fechou func");
      }
    }
  }

  parseCommands() {
    if (this.check("if")) {
      this.parseConditional();
    } else if (this.check("while")) {
      this.parseLoop();
    } else if (this.check("read")) {
      this.parseRead();
    } else if (this.check("print")) {
      this.parsePrint();
    } else if (this.check("return")) {
      this.parseReturn();
    } else if (
      this.consume("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseIdentifierCommands();
    }
  }

  parseIdentifierCommands() {
    if (
      this.consume("String", true) ||
      this.consume("Number") ||
      this.consume("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseIdentifierWithoutFunction();
      this.parseIdentifierCommands2();
      if (this.consume(";")) {
        return;
      }
    }
  }

  parseIdentifierCommands2() {
    if (this.consume("=")) {
      this.parseIdentifierCommands2_1();
    } else if (this.consume("(")) {
      this.parseParametersList();
      if (this.consume(")")) {
        return;
      }
    }
  }

  parseIdentifierCommands2_1() {
    if (this.consume("String", true) || this.consume("Number")) {
    } else if (
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.consume("Identifier", true)
    ) {
      this.parseArithmeticExpression();
    }
  }

  parseReturn() {
    if (this.consume("return")) {
      this.parseReturnCode();
    }
  }

  parseReturnCode() {
    if (this.consume(";")) {
      return;
    } else if (
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.consume("Number", true) ||
      this.consume("Identifier", true)
    ) {
      this.parseArithmeticExpression();
      if (this.consume(";")) {
        return;
      }
    }
  }

  /**
   * Generate Function And Procedure
   */

  parseGenerateFuncAndProc() {
    if (this.check("function")) {
      this.parseFunction();
      this.parseGenerateFuncAndProc();
    } else if (this.check("procedure")) {
      this.parseProcedure();
      this.parseGenerateFuncAndProc();
    }
  }

  parseFunction() {
    if (this.consume("function")) {
      if (this.consumeType()) {
        if (this.consume("Identifier", true)) {
          if (this.consume("(")) {
            this.parseParam();
          }
        }
      }
    }
  }

  parseProcedure() {
    console.log("abriu procedure");
    if (this.consume("procedure")) {
      if (this.consume("Identifier", true)) {
        if (this.consume("(")) {
          this.parseParam();
        }
      }
    }
  }

  parseParam() {
    if (this.consumeType()) {
      if (this.consume("Identifier", true)) {
        this.parseParam2();
        this.parseParam1();
      }
    }
  }

  parseParam1() {
    if (this.consume(",")) {
      this.parseParam();
    } else if (this.consume(")")) {
      this.parseF2();
    }
  }

  parseParam2() {
    if (this.consume("[")) {
      if (this.consume("]")) {
        this.parseParam3();
      }
    }
  }

  parseParam3() {
    if (this.consume("[")) {
      if (this.consume("]")) {
        return;
      }
    }
  }

  parseF2() {
    if (this.consume("{")) {
      console.log("abriu func");
      this.parseBody();
    }
  }

  parseStart() {
    if (this.consume("start")) {
      if (this.consume("(")) {
        if (this.consume(")")) {
          if (this.consume("{")) {
            this.parseBody();
            if (this.consume("}")) {
              return;
            }
          }
        }
      }
    }
  }

  parseLoop() {
    if (this.consume("while")) {
      if (this.consume("(")) {
        this.parseLogicalRelationalExpression();
        if (this.consume(")")) {
          if (this.consume("{")) {
            this.parseBody();
            if (this.consume("}")) {
              console.log("fechou while");
              return;
            }
          }
        }
      }
    }
  }

  parseConditional() {
    if (this.consume("if")) {
      if (this.consume("(")) {
        this.parseLogicalRelationalExpression();
        if (this.consume(")")) {
          if (this.consume("then")) {
            if (this.consume("{")) {
              this.parseBody();
              if (this.consume("}")) {
                this.parseConditionalEnd();
              }
            }
          }
        }
      }
    }
  }

  parseConditionalEnd() {
    if (this.consume("else")) {
      if (this.consume("{")) {
        this.parseBody();
        if (this.consume("}")) {
          return;
        }
      }
    }
  }

  matchFirstSet(lexeme, set) {
    return this.firstSet[set].includes(lexeme);
  }

  mountFirstSets() {
    this.firstSet["scope"] = ["local", "global"];
    this.firstSet["identifier_access"] = [".", "["];
    this.firstSet["t2"] = ["*", "/"];
    this.firstSet["arithmetic_expression"] = [
      "++",
      "--",
      "(",
      "local",
      "global"
    ];
    this.firstSet["commands"] = ["while", "if", "print", "read", "return"];
  }

  followSets(key) {
    let sets = {
      const: {
        tokens: [],
        lexemes: ["typedef", "var", "function", "procedure", "start"]
      },
      typeConst: {
        tokens: [],
        lexemes: ["typedef", "var", "function", "procedure", "start"]
      }
    };
    return sets[key];
  }
}

module.exports = SyntaticalAnalyzer;
