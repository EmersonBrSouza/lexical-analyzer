const Definitions = require("./syntax_definitions");
const fs = require('fs');
const path = require('path');

class SyntaticalAnalyzer {
  constructor(tokens, filename, semantic) {
    this.tokens = tokens;
    this.filename = filename;
    this.semantic = semantic;
    this.tokenPointer = 0;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLine = this.tokens[this.tokenPointer].line;
    this.firstSet = [];
    this.errors = [];
    this.mountFirstSets();
  }

  eof() {
    return this.tokenPointer + 1 == this.tokens.length;
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

  checkType(includeId = false) {
    if (includeId) {
      return Definitions.types.includes(this.currentLexeme) || this.currentToken == 'Identifier';
    }
    return Definitions.types.includes(this.currentLexeme)
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

  consumeType(includeId = false) {
    if (this.checkType(includeId)) {
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
    if (this.tokenPointer + 1 >= this.tokens.length) return;
    this.tokenPointer++;
    this.currentLexeme = this.tokens[this.tokenPointer].lexeme;
    this.currentToken = this.tokens[this.tokenPointer].token;
    this.currentLine = this.tokens[this.tokenPointer].line;
  }

  isBoolean () {
    if (Definitions.boolean.includes(this.currentLexeme)) {
      return true;
    }
    return false;
  }

  isRelationalOperator () {
    if (Definitions.relationalOperator.includes(this.currentLexeme)) {
      return true;
    }
    return false;
  }

  isLogicalOperator () {
    if (Definitions.logicalOperator.includes(this.currentLexeme)) {
      return true;
    }
    return false;
  }

  handleError(expected, received, line) {
    console.log(
      `Esperava '${expected}' mas recebeu '${received}' na linha ${line}`
    );
    this.errors.push({ expected, received, line });
  }

  sync(followSet) {
    let found = false;
    while (!this.eof()) {
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
    // console.table(this.tokens)
    this.parseConst();
    this.parseStruct();
    this.parseVar();
    this.parseGenerateFuncAndProc();
    this.parseStart();
    
    if (this.errors.length == 0) {
      console.log("A análise sintática não encontrou erros! \n")
    } else {
      console.table(this.errors)
    }
    
    this.writeFile();
    this.semantic.showErrors();
  }

  writeFile () {
    let filenumber = this.filename.split('entrada').join('').split('.txt')[0];
    const logger = fs.createWriteStream(path.resolve("output", `saida${filenumber}.txt`), { flags: 'a' })
    logger.write(`----------------------------------------------------------------------\n\n`)
    logger.write(`\nLista de Erros Sintáticos:\n\n`)
    this.errors.forEach(error => {
      logger.write(`${error.line} ${error.expected} ${error.received}\n`)
    });
    logger.write(`----------------------------------------------------------------------\n\n`)
    logger.end();
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
    let currentType = null;
    if (this.checkType(false)) {
      currentType = this.currentLexeme;
    }
    if (this.consumeType(false)) {
      this.parseConstExpression(currentType);
    } else {
      this.handleError("int, real, boolean or string", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("typeConst"));
      switch (this.currentLexeme) {
        case "typedef": this.parseStruct(); break;
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case "}":
          this.nextToken();
          this.parseStruct();
          break;
        case "real": this.parseTypeConst(); break;
        case "boolean": this.parseTypeConst(); break;
        case "int": this.parseTypeConst(); break;
        case "string": this.parseTypeConst(); break;
        case this.eof(): return;
      }
    }
  }

  parseConstExpression(currentType) {
    let data = { identifier: this.currentLexeme, value: null }
    if (this.consume("Identifier", true)) {
      data.value = this.currentLexeme;
      if (this.consumeValue(this.currentLexeme)) {
          if (!this.semantic.has(data.identifier, 'global', ['const', 'var'])) {
            if (this.semantic.checkType(currentType, data.value)) {
              this.semantic.insertGlobal('const', data.identifier, {
                family: 'const',
                token: 'Identifier',
                lexeme: data.identifier,
                type: currentType,
                value: data.value,
                line: this.currentLine
              })
            } else {
              this.semantic.appendError({
                error: 'Invalid Type',
                expected: currentType,
                received: data.value,
                line: this.currentLine
              })
            }
          } else {
            this.semantic.appendError({
              error: 'Const or Var already exists in global scope',
              received: data.identifier,
              line: this.currentLine
            })
          }
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
    } else {
      this.handleError(", or ;", this.currentLexeme, this.currentLine);
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

  parseConstTermination() {
    if (this.checkType()) {
      this.parseTypeConst();
      return;
    } else if (this.consume("}")) {
      return;
    } else {
      this.handleError("}", this.currentLexeme, this.currentLine);
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

  parseStruct() {
    if (this.consume("typedef")) {
      if (this.consume("struct")) {
        let data = { identifier: this.currentLexeme, args: [], extends: null, line: this.currentLine }
        if (this.consume("Identifier", true)) {
          this.parseStructExtends(data);
        } else {
          this.handleError("Identifier", this.currentLexeme, this.currentLine);
          this.sync(this.followSets("struct"));
          switch (this.currentLexeme) {
            case "var": this.parseVar(); break;
            case "function": this.parseGenerateFuncAndProc(); break;
            case "procedure": this.parseGenerateFuncAndProc(); break;
            case "start": this.parseGenerateFuncAndProc(); break;
            case this.eof(): return;
          }
        }
      } else {
        this.handleError("struct", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("struct"));
        switch (this.currentLexeme) {
          case "var": this.parseVar(); break;
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
        }
      }
    }
  }

  parseStructExtends(data) {
    if (this.consume("extends")) {
      data.extends = this.currentLexeme;
      if (this.consume("Identifier", true)) {
        if (this.consume("{")) {
          if(this.semantic.has(data.extends, 'global', ['struct']))  {
            this.parseTypeStruct(data);
          } else {
            this.semantic.appendError({ 
              error: 'Struct can\'t extends from undefined', 
              expected: data.extends, 
              line: this.currentLine
            })
          }
        }
      } else {
        this.handleError("extends or {", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("struct"));
        switch (this.currentLexeme) {
          case "typedef": this.parseStruct(); break;
          case "var": this.parseVar(); break;
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
        }
      }
    } else if (this.consume("{")) {
      this.parseTypeStruct(data);
    } else {
      this.handleError("extends or {", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("struct"));
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

  parseTypeStruct(data) {
    let currentArg = { type: this.currentLexeme };
    if (this.consumeType(true)) {
      this.parseStructExpression(data, currentArg);
    }
  }

  parseStructExpression(data, currentArg) {
    currentArg.identifier = this.currentLexeme;
    if (this.consume("Identifier", true)) {
      this.parseStructContinuation(data, currentArg);
    } else {
      this.handleError("Identifier or int, boolean, string, real", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("struct"));
      switch (this.currentLexeme) {
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
      }
    }
  }

  parseStructContinuation(data, currentArg) {
    if (data.args.filter((el) => el.identifier === currentArg.identifier).length == 0) {
      data.args.push(currentArg);
    } else {
      this.semantic.appendError({
        error: "Attribute already exists in struct context",
        received: currentArg.identifier,
        line: this.currentLine
      })
    }

    if (this.consume(",")) {
      this.parseStructExpression(data, currentArg);
    } else if (this.consume(";")) {
      this.parseStructTermination(data);
    } else {
      this.handleError(", or ;", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("typeStruct"));
      switch (this.currentLexeme) {
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case "}":
          this.nextToken();
          this.parseVar();
          break;
        case "real": this.parseTypeStruct(); break;
        case "boolean": this.parseTypeStruct(); break;
        case "int": this.parseTypeStruct(); break;
        case "string": this.parseTypeStruct(); break;
        case this.eof(): return;
      }
    }
  }

  parseStructTermination(data) {
    if (this.consume("}")) {
      this.semantic.insertGlobal('struct', data.identifier, data)
      this.parseStruct();
      return;
    } else if (this.checkType()) {
      this.parseTypeStruct(data);
      return;
    } else {
      this.handleError("}", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("struct"));
      switch (this.currentLexeme) {
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
      }
    }
  }

  parseVar(scope = 'global') {
    if (this.consume("var")) {
      if (this.consume("{")) {
        this.parseTypeVar(scope);
      } else {
        this.handleError("{", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("var"));
        switch (this.currentLexeme) {
          case "function": this.parseFunction(); break;
          case "procedure": this.parseProcedure(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
        }
      }
    }
  }

  parseTypeVar(scope = 'global') {
    let currentType = null;
    if (this.checkType(false)) {
      currentType = this.currentLexeme;
    }
    if (this.consumeType(true)) {
      this.parseVarExpression(currentType, scope);
    }
  }

  parseVarExpression(currentType, scope = 'global') {
    let varName = null;
    if (this.check("Identifier", true)) {
      varName = this.currentLexeme;
    }
    if (this.consume("Identifier", true)) {
      this.parseVarContinuation(currentType, varName, scope);
    } else {
      this.handleError("Identifier or int, boolean, string, real", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("var"));
      switch (this.currentLexeme) {
        case "var": this.parseVar(); break;
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
      }
    }
  }

  parseVarContinuation(currentType, varName, scope = 'global') {
    if (this.consume(",")) {
      this.parseVarExpression();
    } else if (this.consume(";")) {
      this.parseVarTermination();
    } else if (this.check("[")) {
      this.parseVector(currentType, varName, scope);
    } else if (this.consume("=")) {
      let value = this.checkValue() ? { lexeme: this.currentLexeme, token: this.currentToken } : null;
      if (this.consumeValue()) {
        if (scope == 'global') {
          if (!this.semantic.has(varName, 'global', ['const', 'var'])) {
            if (value.token == 'Identifier') {
              if (this.semantic.has(value.lexeme, 'global', ['const', 'var'])) {
                this.semantic.insertGlobal('var', varName, {
                  family: 'var',
                  token: 'Identifier',
                  lexeme: varName,
                  type: currentType,
                  value: value.lexeme,
                  line: this.currentLine
                })
              } else {
                this.semantic.appendError({
                  error: 'Undefined Variable or Const',
                  expected: value.lexeme,
                  line: this.currentLine
                })
              }
            } else {
              if (this.semantic.checkType(currentType, value.lexeme)) {
                this.semantic.insertGlobal('var', varName, {
                  family: 'var',
                  token: 'Identifier',
                  lexeme: varName,
                  type: currentType,
                  value: value.lexeme,
                  line: this.currentLine
                })
              } else {
                this.semantic.appendError({
                  error: 'Invalid Type',
                  expected: currentType,
                  received: value.lexeme,
                  line: this.currentLine
                })
              }
            }
          } else {
            this.semantic.appendError({
              error: 'Const or Var already exists in global scope',
              received: varName,
              line: this.currentLine
            })
          }
        } else if (scope == "local") {
          console.log("EITA BIXO, LOCALLL")
        }
        this.parseVarAttribuition();
      } else {
        this.handleError("Value to be assigned to variable", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("typeVar"));
        switch (this.currentLexeme) {
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case "}":
            this.nextToken();
            this.parseGenerateFuncAndProc();
            break;
          case "real": this.parseTypeVar(); break;
          case "boolean": this.parseTypeVar(); break;
          case "int": this.parseTypeVar(); break;
          case "string": this.parseTypeVar(); break;
          case this.eof(): return;
        }
      }
    } else {
      this.handleError(", or ; or = or [", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("typeVar"));
      switch (this.currentLexeme) {
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case "}":
          this.nextToken();
          this.parseGenerateFuncAndProc();
          break;
        case "real": this.parseTypeVar(); break;
        case "boolean": this.parseTypeVar(); break;
        case "int": this.parseTypeVar(); break;
        case "string": this.parseTypeVar(); break;
        case this.eof(): return;
      }
    }
  }

  parseVarAttribuition() {
    if (this.consume(",")) {
      this.parseVarExpression();
    } else if (this.consume(";")) {
      this.parseVarTermination();
    } else {
      this.handleError(", or ;", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("typeVar"));
      switch (this.currentLexeme) {
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case "}":
          this.nextToken();
          this.parseGenerateFuncAndProc();
          break;
        case "real": this.parseTypeVar(); break;
        case "boolean": this.parseTypeVar(); break;
        case "int": this.parseTypeVar(); break;
        case "string": this.parseTypeVar(); break;
        case this.eof(): return;
      }
    }
  }

  parseVarTermination() {
    if (this.consume("}")) {
      return;
    } else if (this.checkType(true)) {
      this.parseTypeVar();
      return;
    } else {
      this.handleError("}", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("var"));
      switch (this.currentLexeme) {
        case "function": this.parseGenerateFuncAndProc(); break;
        case "procedure": this.parseGenerateFuncAndProc(); break;
        case "start": this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
      }
    }
  }

  parseVector(currentType, varName, scope) {
    if (this.consume("[")) {
      let firstIndex = this.checkVectorIndex() ? this.currentLexeme : null;
      if (this.consumeVectorIndex()) {
        if (this.consume("]")) {
          this.parseMatrix(currentType, varName, firstIndex, scope);
        } else {
          this.handleError("]", this.currentLexeme, this.currentLine);
          this.sync(this.followSets("var"));
          switch (this.currentLexeme) {
            case "function": this.parseGenerateFuncAndProc(); break;
            case "procedure": this.parseGenerateFuncAndProc(); break;
            case "start": this.parseGenerateFuncAndProc(); break;
            case "}":
            this.nextToken();
            this.parseGenerateFuncAndProc();
            break;
            case "real": this.parseTypeVar(); break;
            case "boolean": this.parseTypeVar(); break;
            case "int": this.parseTypeVar(); break;
            case "string": this.parseTypeVar(); break;
            case this.eof(): return;
          }
        }
      } else {
        this.handleError("Vector index: an Identifier or a positive integer", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("var"));
        switch (this.currentLexeme) {
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case "}":
          this.nextToken();
          this.parseGenerateFuncAndProc();
          break;
          case "real": this.parseTypeVar(); break;
          case "boolean": this.parseTypeVar(); break;
          case "int": this.parseTypeVar(); break;
          case "string": this.parseTypeVar(); break;
          case this.eof(): return;
        }
      }
    }
  }

  parseMatrix(currentType, varName, firstIndex, scope) {
    if (this.consume("[")) {
      let secondIndex = this.checkVectorIndex() ? this.currentLexeme : null;
      if (this.consumeVectorIndex()) {
        if (scope == 'global') {
          if (!this.semantic.has(varName, 'global', ['const', 'var'])) {
            this.semantic.insertGlobal('var', varName, {
              family: 'var',
              token: 'Identifier',
              lexeme: varName,
              type: currentType,
              line: this.currentLine,
              isArray: true,
              arraySize: { firstIndex, secondIndex }
            })
          } else {
            this.semantic.appendError({
              error: 'Const or Var already exists in global scope',
              received: varName,
              line: this.currentLine
            })
          }
        } else if (scope == "local") {
          console.log("EITA BIXO, MATRIX LOCALLL")
        }
        if (this.consume("]")) {
          this.parseVarAttribuition();
        } else {
          this.handleError("]", this.currentLexeme, this.currentLine);
          this.sync(this.followSets("var"));
          switch (this.currentLexeme) {
            case "function": this.parseGenerateFuncAndProc(); break;
            case "procedure": this.parseGenerateFuncAndProc(); break;
            case "start": this.parseGenerateFuncAndProc(); break;
            case "}":
            this.nextToken();
            this.parseGenerateFuncAndProc();
            break;
            case "real": this.parseTypeVar(); break;
            case "boolean": this.parseTypeVar(); break;
            case "int": this.parseTypeVar(); break;
            case "string": this.parseTypeVar(); break;
            case this.eof(): return;
          }
        }
      } else {
        this.handleError("Vector index: an Identifier or a positive integer", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("var"));
        switch (this.currentLexeme) {
          case "function": this.parseGenerateFuncAndProc(); break;
          case "procedure": this.parseGenerateFuncAndProc(); break;
          case "start": this.parseGenerateFuncAndProc(); break;
          case "}":
          this.nextToken();
          this.parseGenerateFuncAndProc();
          break;
          case "real": this.parseTypeVar(); break;
          case "boolean": this.parseTypeVar(); break;
          case "int": this.parseTypeVar(); break;
          case "string": this.parseTypeVar(); break;
          case this.eof(): return;
        }
      }
    } else {
      if (scope == 'global') {
        if (!this.semantic.has(varName, 'global', ['const', 'var'])) {
          this.semantic.insertGlobal('var', varName, {
            family: 'var',
            token: 'Identifier',
            lexeme: varName,
            type: currentType,
            line: this.currentLine,
            isArray: true,
            arraySize: { firstIndex }
          })
        } else {
          this.semantic.appendError({
            error: 'Const or Var already exists in global scope',
            received: varName,
            line: this.currentLine
          })
        }
      } else if (scope == "local") {
        console.log("EITA BIXO, ARRAY LOCALLL")
      }
      this.parseVarAttribuition();
    }
  }

  // Relative to ListaParametros
  parseParametersList() {
    if (
      this.matchFirstSet(this.currentLexeme, "scope") ||
      this.check("Number", true) ||
      this.check("String", true) ||
      this.check("Identifier", true)
    ) {
      this.parseParametersListEnd();
      this.parseParametersListContinuation();
    }
  }

  // Relative to ContListaParametros
  parseParametersListContinuation() {
    if (this.consume(",")) {
      this.parseParametersList();
    } else if (this.check("Identifier", true) || this.checkType()) {
      this.handleError(',', this.currentLexeme, this.currentLine)
      this.sync(this.followSets('commands'))
      switch (this.currentLexeme) {
        case this.eof(): return;
        case 'start' : this.parseStart(); break;
        default: this.parseCommands(); break;
      }
    }
  }

  // Relative to ListaParametros2
  parseParametersListEnd() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
      this.consume(this.currentLexeme)
    } else if (this.check("Number", true) || this.check("String", true) || this.check("Identifier", true)) {
      this.consume(this.currentLexeme)
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
    } else if (this.consume('(')) {
      this.parseParametersList();
      if (this.consume(')')) {
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
    } else if (this.check('Identifier', true)){
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
        } else {
          this.handleError('.', this.currentLexeme, this.currentLine)
          this.sync(this.followSets('commands'))
          switch (this.currentLexeme) {
            case this.eof(): return;
            default: this.parseCommands(); break;
          }
        }
      }
    }
  }

  parseIdentifierWithoutFunction() {
    if (this.matchFirstSet(this.currentLexeme, "scope")) {
      this.parseScope()
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
      if (this.check("Identifier", true)) {
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
        this.handleError("(", this.currentLexeme,this.currentLine);
        this.sync(this.followSets('commands'));
        if (this.currentToken == "Identifier") {
          this.parsePrintContent();
        } else {
          switch (this.currentLexeme) {
            case 'start': this.parseStart(); break;
            case '}' : this.parseGenerateFuncAndProc(); break;
            case this.eof(): return;
            default: this.parseCommands(); break;
          }
        }
      }
    }
  }

  parsePrintContent() {
    if (
      this.check("String", true) ||
      this.check("Number", true) ||
      this.check("Identifier", true)
    ) {
      this.consume(this.currentLexeme)
      this.parsePrintContinuation();
    } else if (this.matchFirstSet(this.currentLexeme, "scope")) {
      this.parsePrintContinuation();
    } else {
      this.handleError("Identifier, String or Number", this.currentLexeme,this.currentLine);
      this.sync(this.followSets('commands'));
      switch (this.currentLexeme) {
        case 'start': this.parseStart(); break;
        case '}' : this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
        default: this.parseCommands(); break;
      }
    }
  }

  parsePrintContinuation() {
    if (this.consume(",")) {
      this.parsePrintContent();
    } else if (this.check(")")) {
      this.parsePrintEnd();
    } else {
      this.handleError(", or )", this.currentLexeme,this.currentLine);
      this.sync(this.followSets('commands'));
      switch (this.currentLexeme) {
        case 'start': this.parseStart(); break;
        case '}' : this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
        default: this.parseCommands(); break;
      }
    }
  }

  parsePrintEnd() {
    if (this.consume(")")) {
      if (this.consume(";")) {
        return;
      } else {
        this.handleError(";", this.currentLexeme,this.currentLine);
        this.sync(this.followSets('commands'));
        switch (this.currentLexeme) {
          case 'start': this.parseStart(); break;
          case '}' : this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
          default: this.parseCommands(); break;
        }
      }
    }
  }

  parseRead() {
    if (this.consume("read")) {
      if (this.consume("(")) {
        this.parseReadContent();
      } else {
        this.handleError("(", this.currentLexeme,this.currentLine);
        this.sync(this.followSets('commands'));
        if (this.currentToken == "Identifier") {
          this.parsePrintContent();
        } else {
          switch (this.currentLexeme) {
            case 'start': this.parseStart(); break;
            case '}' : this.parseGenerateFuncAndProc(); break;
            case this.eof(): return;
            default: this.parseCommands(); break;
          }
        }
      }
    }
  }

  parseReadContent() {
    if (
      this.check("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseIdentifierWithoutFunction();
      this.parseReadContinuation();
    } else {
      this.handleError("Identifier", this.currentLexeme,this.currentLine);
      this.sync(this.followSets('commands'));
      switch (this.currentLexeme) {
        case 'start': this.parseStart(); break;
        case '}' : this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
        default: this.parseCommands(); break;
      }
    }
  }

  parseReadContinuation() {
    if (this.consume(",")) {
      this.parseReadContent();
    } else if (this.check(")")) {
      this.parseReadEnd();
    } else {
      this.handleError(", or )", this.currentLexeme,this.currentLine);
      this.sync(this.followSets('commands'));
      switch (this.currentLexeme) {
        case 'start': this.parseStart(); break;
        case '}' : this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
        default: this.parseCommands(); break;
      }
    }
  }

  parseReadEnd() {
    if (this.consume(")")) {
      if (this.consume(";")) {
        return;
      } else {
        this.handleError(";", this.currentLexeme,this.currentLine);
        this.sync(this.followSets('commands'));
        switch (this.currentLexeme) {
          case 'start': this.parseStart(); break;
          case '}' : this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
          default: this.parseCommands(); break;
        }
      }
    }
  }

  parseBody() {
    if (this.check("var")) {
      this.parseVar("local");
    }
    this.parseBody2();
    if (this.consume("}")) {
      return;
    } else {
      this.handleError("}", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("generateFuncAndProc"));
      switch (this.currentLexeme) {
        case this.eof():
          console.log("Fim do Arquivo");
          return;
        default: this.parseGenerateFuncAndProc(); break;
      }
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
      this.check("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseIdentifierCommands();
    }
  }

  parseIdentifierCommands() {
    if (
      this.check("String", true) ||
      this.check("Number") ||
      this.check("Identifier", true) ||
      this.matchFirstSet(this.currentLexeme, "scope")
    ) {
      this.parseIdentifierWithoutFunction();
      this.parseIdentifierCommands2();
      if (this.consume(";")) {
        return;
      } else {
        this.handleError(";", this.currentLexeme,this.currentLine);
        this.sync(this.followSets('commands'));
        switch (this.currentLexeme) {
          case 'start': this.parseStart(); break;
          case '}' : this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
          default: this.parseCommands(); break;
        }
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
      } else {
        this.handleError(')', this.currentLexeme, this.currentLine)
        this.sync(this.followSets('commands'))
        switch (this.currentLexeme) {
          case this.eof(): return;
          case 'start' : this.parseStart(); break;
          default: this.parseCommands(); break;
        }
      }
    }
  }

  parseIdentifierCommands2_1() {
    if (this.check("String", true) || this.check("Number", true) || this.check("true") || this.check("false")) {
      this.consume(this.currentLexeme)
    } else if (
      this.matchFirstSet(this.currentLexeme, "arithmetic_expression") ||
      this.consume("Identifier", true)
    ) {
      this.parseArithmeticExpression();
    } else {
      this.handleError("Some expression at right side", this.currentLexeme,this.currentLine);
      this.sync(this.followSets('commands'));
      switch (this.currentLexeme) {
        case 'start': this.parseStart(); break;
        case '}' : this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
        default: this.parseCommands(); break;
      }
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
      this.check("Number", true) ||
      this.check("Identifier", true)
    ) {
      this.parseArithmeticExpression();
      if (this.consume(";")) {
        return;
      } else {
        this.handleError(";", this.currentLexeme,this.currentLine);
        this.sync(this.followSets('commands'));
        switch (this.currentLexeme) {
          case 'start': this.parseStart(); break;
          case '}' : this.parseGenerateFuncAndProc(); break;
          case this.eof(): return;
          default: this.parseCommands(); break;
        }
      }
    } else {
      this.handleError(";", this.currentLexeme,this.currentLine);
      this.sync(this.followSets('commands'));
      switch (this.currentLexeme) {
        case 'start': this.parseStart(); break;
        case '}' : this.parseGenerateFuncAndProc(); break;
        case this.eof(): return;
        default: this.parseCommands(); break;
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
      if (this.consumeType(true)) {
        if (this.consume("Identifier", true)) {
          if (this.consume("(")) {
            this.parseParam();
          } else {
            this.handleError("(", this.currentLexeme, this.currentLine);
            this.sync(this.followSets("parameters"));
            switch (this.currentLexeme) {
              case "int": this.parseParam(); break;
              case "real": this.parseParam(); break;
              case "boolean": this.parseParam(); break;
              case "string": this.parseParam(); break;
              case "{":
                this.nextToken();
                this.parseBody();
                break;
              case this.currentToken == "Identifier": 
                this.nextToken();
                this.parseParam();
                break;
              case this.eof(): return;
            }
          }
        } else {
          this.handleError("Identifier", this.currentLexeme, this.currentLine);
          this.sync(this.followSets("typeFunction"));
          switch (this.currentLexeme) {
            case "function": this.parseFunction(); break;
            case "procedure": this.parseProcedure(); break;
            case "start": this.parseStart(); break;
            case "{":
              this.nextToken();
              this.parseGenerateFuncAndProc();
              break;
            case "(": 
              this.nextToken();
              this.parseParam();
              break;
            case this.currentToken == "Identifier": 
              this.nextToken();
              this.parseParam();
              break;
            case this.eof(): return;
          }
        }
      } else {
        this.handleError("int, real, string, boolean or Identifier", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("typeFunction"));
        switch (this.currentLexeme) {
          case "function": this.parseFunction(); break;
          case "procedure": this.parseProcedure(); break;
          case "start": this.parseStart(); break;
          case "{":
            this.nextToken();
            this.parseGenerateFuncAndProc();
            break;
          case "(": 
            this.nextToken();
            this.parseParam();
            break;
          case this.currentToken == "Identifier": 
            this.nextToken();
            this.parseParam();
            break;
          case this.eof(): return;
        }
      }
    }
  }

  parseProcedure() {
    if (this.consume("procedure")) {
      if (this.consume("Identifier", true)) {
        if (this.consume("(")) {
          this.parseParam();
        } else {
          this.handleError("(", this.currentLexeme, this.currentLine);
          this.sync(this.followSets("parameters"));
          switch (this.currentLexeme) {
            case "int": this.parseParam(); break;
            case "real": this.parseParam(); break;
            case "boolean": this.parseParam(); break;
            case "string": this.parseParam(); break;
            case "{":
              this.nextToken();
              this.parseBody();
              break;
            case this.currentToken == "Identifier": 
              this.nextToken();
              this.parseParam();
              break;
            case this.eof(): return;
          }
        }
      } else {
        this.handleError("Identifier", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("procedure"));
        switch (this.currentLexeme) {
          case "{": this.parseF2(); break;
          case "function": this.parseFunction(); break;
          case "procedure": this.parseProcedure(); break;
          case "(": 
            this.nextToken();
            this.parseParam();
            break;
          case this.eof(): return;
          default: this.parseCommands(); break;
        }
      }
    }
  }

  parseParam() {
    if (this.consumeType()) {
      if (this.consume("Identifier", true)) {
        this.parseParam2();
        this.parseParam1();
      } else {
        this.handleError("Identifier", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("parameters"));
        switch (this.currentLexeme) {
          case "int": this.parseParam(); break;
          case "real": this.parseParam(); break;
          case "boolean": this.parseParam(); break;
          case "string": this.parseParam(); break;
          case "{":
            this.nextToken();
            this.parseBody();
            break;
          case this.currentToken == "Identifier": 
            this.nextToken();
            this.parseParam();
            break;
          case this.eof(): return;
        }
      }
    } else {
      this.handleError("Parameter Type", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("parameters"));
      switch (this.currentLexeme) {
        case "int": this.parseParam(); break;
        case "real": this.parseParam(); break;
        case "boolean": this.parseParam(); break;
        case "string": this.parseParam(); break;
        case "{":
          this.nextToken();
          this.parseBody();
          break;
        case this.currentToken == "Identifier": 
          this.nextToken();
          this.parseParam();
          break;
        case this.eof(): return;
      }
    }
  }

  parseParam1() {
    if (this.consume(",")) {
      this.parseParam();
    } else if (this.consume(")")) {
      this.parseF2();
    } else {
      this.handleError(", or )", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("parameters"));
      switch (this.currentLexeme) {
        case "int": this.parseParam(); break;
        case "real": this.parseParam(); break;
        case "boolean": this.parseParam(); break;
        case "string": this.parseParam(); break;
        case "{":
          this.parseF2();
          break;
        case this.currentToken == "Identifier": 
          this.nextToken();
          this.parseParam();
          break;
        case this.eof(): return;
      }
    }
  }

  parseParam2() {
    if (this.consume("[")) {
      if (this.consume("]")) {
        this.parseParam3();
      } else {
        this.handleError("]", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("parameters"));
        switch (this.currentLexeme) {
          case "int": this.parseParam(); break;
          case "real": this.parseParam(); break;
          case "boolean": this.parseParam(); break;
          case "string": this.parseParam(); break;
          case "{":
            this.parseF2();
            break;
          case this.currentToken == "Identifier": 
            this.nextToken();
            this.parseParam();
            break;
          case this.eof(): return;
        }
      }
    }
  }

  parseParam3() {
    if (this.consume("[")) {
      if (this.consume("]")) {
        return;
      } else {
        this.handleError("]", this.currentLexeme, this.currentLine);
        this.sync(this.followSets("parameters"));
        switch (this.currentLexeme) {
          case "int": this.parseParam(); break;
          case "real": this.parseParam(); break;
          case "boolean": this.parseParam(); break;
          case "string": this.parseParam(); break;
          case "{":
            this.parseF2();
            break;
          case this.currentToken == "Identifier": 
            this.nextToken();
            this.parseParam();
            break;
          case this.eof(): return;
        }
      }
    }
  }

  parseF2() {
    if (this.consume("{")) {
      this.parseBody();
    } else {
      this.handleError("{", this.currentLexeme, this.currentLine);
      this.sync(this.followSets("functionBody"));
      switch (this.currentLexeme) {
        case this.eof(): return;
        default: this.parseBody(); break;
      }
    }
  }

  parseStart() {
    if (this.consume("start")) {
      if (this.consume("(")) {
        if (this.consume(")")) {
          if (this.consume("{")) {
            this.parseBody();
          } else {
            this.handleError("{", this.currentLexeme,this.currentLine);
            while(!this.eof()) {
              this.nextToken();
            }
            return;
          }
        } else {
          this.handleError(")", this.currentLexeme,this.currentLine);
          while(!this.eof()) {
            this.nextToken();
          }
          return;
        }
      } else {
        this.handleError("(", this.currentLexeme,this.currentLine);
        while(!this.eof()) {
          this.nextToken();
        }
        return;
      }
    } else {
      this.handleError("start", this.currentLexeme,this.currentLine);
      while(!this.eof()) {
        this.nextToken();
      }
      return;
    }
  }

  parseLoop() {
    if (this.consume("while")) {
      if (this.consume("(")) {
        this.parseLogicalRelationalExpression();
        if (this.consume(")")) {
          if (this.consume("{")) {
            this.parseBody();
          } else {
            this.handleError('{', this.currentLexeme, this.currentLine)
            this.sync(this.followSets('commands'))
            switch (this.currentLexeme) {
              case this.eof(): return;
              case 'start' : this.parseStart(); break;
              default: this.parseCommands(); break;
            }
          }
        } else {
          this.handleError(')', this.currentLexeme, this.currentLine)
          this.sync(this.followSets('commands'))
          switch (this.currentLexeme) {
            case this.eof(): return;
            case 'start' : this.parseStart(); break;
            default: this.parseCommands(); break;
          }
        }
      } else {
        this.handleError('(', this.currentLexeme, this.currentLine)
        this.sync(this.followSets('commands'))
        switch (this.currentLexeme) {
          case this.eof(): return;
          case 'start' : this.parseStart(); break;
          default: this.parseCommands(); break;
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
              this.parseConditionalEnd();
            } else {
              this.handleError('{', this.currentLexeme, this.currentLine)
              this.sync(this.followSets('commands'))
              switch (this.currentLexeme) {
                case this.eof(): return;
                case 'start' : this.parseStart(); break;
                default: this.parseCommands(); break;
              }
            }
          } else {
            this.handleError('then', this.currentLexeme, this.currentLine)
            this.sync(this.followSets('commands'))
            switch (this.currentLexeme) {
              case this.eof(): return;
              case 'start' : this.parseStart(); break;
              default: this.parseCommands(); break;
            }
          }
        } else {
          this.handleError(')', this.currentLexeme, this.currentLine)
          this.sync(this.followSets('commands'))
          switch (this.currentLexeme) {
            case this.eof(): return;
            case 'start' : this.parseStart(); break;
            default: this.parseCommands(); break;
          }
        }
      } else {
        this.handleError('(', this.currentLexeme, this.currentLine)
        this.sync(this.followSets('commands'))
        switch (this.currentLexeme) {
          case this.eof(): return;
          case 'start' : this.parseStart(); break;
          default: this.parseCommands(); break;
        }
      }
    }
  }

  parseConditionalEnd() {
    if (this.consume("else")) {
      if (this.consume("{")) {
        this.parseBody();
      } else {
        this.handleError('{', this.currentLexeme, this.currentLine)
        this.sync(this.followSets('commands'))
        switch (this.currentLexeme) {
          case this.eof(): return;
          case 'start' : this.parseStart(); break;
          default: this.parseCommands(); break;
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
        lexemes: ["typedef", "var", "function", "procedure", "start", 'boolean', '}', 'int', 'real', 'string']
      },
      struct: {
        tokens: [],
        lexemes: ["typedef", "var", "function", "procedure", "start"]
      },
      typeStruct: {
        tokens: ["Identifier"],
        lexemes: ["typedef", "var", "function", "procedure", "start", 'boolean', '}', 'int', 'real', 'string']
      },
      var: {
        tokens: [],
        lexemes: ["function", "procedure", "start"]
      },
      typeVar: {
        tokens: ["Identifier"],
        lexemes: ["function", "procedure", "start", 'boolean', '}', 'int', 'real', 'string']
      },
      typeFunction: {
        tokens: ["Identifier"],
        lexemes: ["function", "procedure", "start", "{", "("]
      },
      parameters: {
        tokens: ["Identifier"],
        lexemes: ["int", "boolean", "string", "real", "{"]
      },
      functionBody: {
        tokens: ["Identifier"],
        lexemes: ["while", "if", "print", "read", "return", "var"]
      },
      procedure: {
        tokens: [],
        lexemes: ["while", "if", "print", "read", "var", '(', '{', 'function', 'procedure'] 
      },
      generateFuncAndProc: {
        tokens: [],
        lexemes: ['function', 'procedure'] 
      },
      commands: {
        tokens: ['Identifier'],
        lexemes: ["}", "start", "while", "if", "print", "read", "return"]
      },
      scope: {
        tokens: ["Identifier"],
        lexemes: ["}", "start", "while", "if", "print", "read", "return"]
      },
      read: {
        tokens: ["Identifier"],
        lexemes: ["}", "start", "while", "if", "print", "read", "return"]
      }
    };
    return sets[key];
  }
}

module.exports = SyntaticalAnalyzer;
