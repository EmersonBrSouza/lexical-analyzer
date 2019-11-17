const fs = require('fs');
const path = require('path');
const Transition = require('./transition');
const Comparator = require('./comparator');

class LexicalAnalyzer {

  constructor (input, filename) {
    if (!input) {
      throw new Error("O analisador léxico precisa de um arquivo válido")
    }
    this.input = input;
    this.filename = filename;
    this.currentPos = 0;
    this.lineNumber = 1;
    this.state = 0;
    this.errors = [];
    this.tokens = [];
  }

  startAnalisis() {
    let raster = "";

    do {
      let currentChar = this.input[this.currentPos]
      console.log(`state ${this.state} | Chunk: ${currentChar} | Raster: ${raster}`);
      switch (this.state) {
        case 0:
          raster = "";
          if (Transition.q0('q1', currentChar)) {
            this.state = 1;
          } else if (Transition.q0('q2',currentChar)) {
            this.state = 2;
          } else if (Transition.q0('q3', currentChar)) {
            this.state = 3;
          } else if (Transition.q0('q10', currentChar)) {
            this.state = 10;
          } else if (Transition.q0('q16', currentChar)) {
            this.state = 15;
          } else if (Transition.q0('q17', currentChar)) {
            this.state = 17;
          } else if (Transition.q0('q18', currentChar)) {
            this.state = 18;
          } else if (Transition.q0('q20', currentChar)) {
            this.state = 20;
          } else if (Transition.q0('q21', currentChar)) {
            this.state = 21;
          } else if (Transition.q0('q22', currentChar)) {
            this.state = 22;
          } else if (Transition.q0('q24', currentChar)) {
            this.state = 24;
          } else if (Transition.q0('q26', currentChar)) {
            this.state = 26;
          }
          else {
            if (Comparator.isBreakline(currentChar)) {
              this.lineNumber++;
            }
            this.currentPos++;
          }
          break;
        case 1:
          while (Transition.q1('q1', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos]
            raster += currentChar;
            this.currentPos++;
          }

          if (Comparator.isIdentifier(raster)) {
            if (Comparator.isReservedWord(raster)) {
              this.tokens.push({ token: "Reserved Word", lexeme: raster, line: this.lineNumber, customCode: 0 })
            } else {
              this.tokens.push({ token: "Identifier", lexeme: raster, line: this.lineNumber, customCode: 3 })
            }
          } else {
            this.errors.push({ error: "BadlyFormattedIdentifier", lexeme: raster, line: this.lineNumber })
          }
          this.state = 0;
          break;
        case 2:
          raster = currentChar;
          if (Transition.q2('q2', raster)) {
            this.tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 });
            this.currentPos++;
            this.state = 0
          }
          break;
        case 3:
          raster += currentChar;
          this.currentPos++;
          currentChar = this.input[this.currentPos];
          
          if (Transition.q3('q3', currentChar)) {
            this.tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
            this.state = 0;
          } else if (Transition.q3('q4', currentChar)) {
            this.state = 4;
          } else if (Transition.q3('q5', currentChar)) {
            this.state = 5;
          } else if (Transition.q3('q8', currentChar)) {
            this.state = 8;
          } else if(this.isEndOfFile()) {
            this.tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
            this.state = 0;
          }
          break;
        case 4:
          raster += currentChar;
          this.tokens.push({ token: "Arithmetic Decrement Operator", lexeme: raster, line: this.lineNumber, customCode: 9 });
          this.currentPos++;
          this.state = 0;
          break;
        case 5:
          while (Transition.q5('q5', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos]
            raster += currentChar;
            this.currentPos++;
          }

          if (Transition.q5('q6', this.input[this.currentPos])) {
            this.state = 6
          } else {
            this.tokens.push({ token: "Number", lexeme: raster, line: this.lineNumber, customCode: 2 });
            this.state = 0;
          }
          break;
        case 6:
          raster += currentChar;
          this.currentPos++;
          currentChar = this.input[this.currentPos];
          if (Transition.q6('q7', currentChar)) {
            this.state = 7;
          } else {
            this.errors.push({ token: "BadlyFormattedNumber", lexeme: raster, line: this.lineNumber });
            this.state = 0;
          }
          break;
        case 7:
          while (Transition.q7('q7', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos]
            raster += currentChar;
            if (!this.isEndOfFile()) {
              this.currentPos++;
            } else {
              break;
            }
          }
          if (Comparator.isValidNumber(raster)) {
            this.tokens.push({ token: "Number", lexeme: raster, line: this.lineNumber, customCode: 1 });
          } else {
            this.errors.push({ error: "BadlyFormattedNumber", lexeme: raster, line: this.lineNumber });
          }
          this.state = 0;
          break;
        case 8:
          while (Transition.q8('q8', this.input[this.currentPos])) {
            this.currentPos++;
          }
          if(Transition.q8('q5', this.input[this.currentPos])) {
            this.state = 5;
          } else if (Transition.q8('q9', this.input[this.currentPos]) || this.isEndOfFile()) {
            this.state = 9;
          }
          break;
        case 9:
          this.tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
          this.state = 0;
          break;
        case 10:
          raster = currentChar;
          this.currentPos++;

          if (Transition.q10('q10', this.input[this.currentPos])) {
            this.tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
            this.state = 0;
          } else if (Transition.q10('q11', this.input[this.currentPos])) {
            this.state = 11;
          } else if (Transition.q10('q12', this.input[this.currentPos])) {
            this.state = 12;
          }
          break;
        case 11:
          while(Transition.q11('q11', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos]
            raster += currentChar;
            if (!this.isEndOfFile()) {
              this.currentPos++;
            } else {
              break;
            }
          }

          if (raster.startsWith('//')) {
            this.tokens.push({ token: "Line Comment", lexeme: raster, line: this.lineNumber, customCode: 10 })
          } else {
            this.errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
          }
          this.state = 0;
          break;
        case 12:
          while(Transition.q12('q12', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos]
            raster += currentChar;

            if (!this.isEndOfFile()) {
              this.currentPos++;
            } else {
              break;
            }
          }

          if (Transition.q12('q13', this.input[this.currentPos])) {
            this.state = 13;
          } else if (this.isEndOfFile()) {
            this.errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
            this.currentPos++;
            this.state = 0;
          }
          break;
        case 13:
          while(Transition.q13('q13', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos]
            raster += currentChar;
            if (!this.isEndOfFile()) {
              this.currentPos++;
            } else {
              break;
            }
          }

          if (Transition.q13('q14', this.input[this.currentPos])) {
            this.state = 14;
          } else if (this.isEndOfFile()) {
            this.errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
            this.currentPos++;
            this.state = 0;
          } else if (Transition.q13('q12', this.input[this.currentPos])) {
            this.state = 12;
          }
          break;
        case 14:
          raster += this.input[this.currentPos];
          if (Comparator.isBlockComment(raster)) {
            this.tokens.push({ token: "Block Comment", lexeme: raster, line: this.lineNumber, customCode: 10 })
          } else {
            this.errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
          }
          this.currentPos++;
          this.state = 0;
          break;
        case 15:
          raster += this.input[this.currentPos];
          this.currentPos++;

          if(Transition.q15("q15", this.input[this.currentPos])) {
            this.tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
            this.state = 0;
          } else if(Transition.q15("q16", this.input[this.currentPos])) {
            this.state = 16;
          }
          break;
        case 16:
          raster += this.input[this.currentPos];
          this.tokens.push({ token: "Arithmetic Increment Operator", lexeme: raster, line: this.lineNumber, customCode: 9 });
          this.currentPos++;
          this.state = 0;
          break;
        case 17:
          raster += currentChar;
          if (Transition.q17("q17", raster)) {
            if (raster == ";") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 12 });
            } else if (raster == ",") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 13 });
            } else if (raster == "(") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 14 });
            } else if (raster == ")") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 15 });
            } else if (raster == "[") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 16 });
            } else if (raster == "]") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 17 });
            } else if (raster == "{") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 18 });
            } else if (raster == "}") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 19 });
            } else if (raster == ".") {
              this.tokens.push({ token: "Delimiter", lexeme: raster, line: this.lineNumber, customCode: 20 });
            }
          }
          this.currentPos++;
          this.state = 0;
          break;
        case 18:
          raster += currentChar;
          this.currentPos++;
          
          if (Transition.q18('q18', this.input[this.currentPos])) {
            this.tokens.push({ token: "Denial Logical Operator", lexeme: raster, line: this.lineNumber, customCode: 5 });
            this.state = 0;
          } else if (Transition.q18('q19', this.input[this.currentPos])) {
            this.state = 19;
          }
          break;
        case 19:
          raster += this.input[this.currentPos];
          if (Transition.q19('q19', this.input[this.currentPos])) {
            this.tokens.push({ token: "Relational Operator", lexeme: raster, line: this.lineNumber, customCode: 6 });
            this.currentPos++;
            this.state = 0;
          } 
          break;
        case 20:
          raster += currentChar;
          this.currentPos++;
          
          if (Transition.q20('q20', this.input[this.currentPos])) {
            this.tokens.push({ token: "Attribuition Operator", lexeme: raster, line: this.lineNumber, customCode: 7 });
            this.state = 0;
          } else if (Transition.q20('q19', this.input[this.currentPos])) {
            this.state = 19;
          }
          break;
        case 21:
          raster += currentChar;
          this.currentPos++;
          
          if (Transition.q21('q21', this.input[this.currentPos])) {
            this.tokens.push({ token: "Relational Operator", lexeme: raster, line: this.lineNumber, customCode: 6 });
            this.state = 0;
          } else if (Transition.q21('q19', this.input[this.currentPos])) {
            this.state = 19;
          }
          break;
        case 22:
          raster += currentChar;
          this.currentPos++;
          
          if (Transition.q22('q22', this.input[this.currentPos])) {
            this.errors.push({ error: "BadlyFormattedOperator", lexeme: raster, line: this.lineNumber });
            this.state = 0;
          } else if (Transition.q22('q23', this.input[this.currentPos])) {
            this.state = 23;
          }
          break;
        case 23:
          raster += this.input[this.currentPos]
          if (Transition.q23('q23', this.input[this.currentPos])) {
            this.tokens.push({ token: "Logical Operator", lexeme: raster, line: this.lineNumber, customCode: 4 });
          } else {
            this.errors.push({ error: "BadlyFormattedOperator", lexeme: raster, line: this.lineNumber });
          }
          this.currentPos++;
          this.state = 0;
          break;
        case 24:
          raster += currentChar;
          this.currentPos++;
          
          if (Transition.q24('q24', this.input[this.currentPos])) {
            this.errors.push({ error: "BadlyFormattedOperator", lexeme: raster, line: this.lineNumber });
            this.state = 0;
          } else if (Transition.q24('q25', this.input[this.currentPos])) {
            this.state = 25;
          }
          break;
        case 25:
          raster += this.input[this.currentPos]
          if (Transition.q25('q25', this.input[this.currentPos])) {
            this.tokens.push({ token: "Logical Operator", lexeme: raster, line: this.lineNumber, customCode: 4 });
          } else {
            this.errors.push({ error: "BadlyFormattedOperator", lexeme: raster, line: this.lineNumber });
          }
          this.currentPos++;
          this.state = 0;
          break;
        case 26:
          raster += this.input[this.currentPos];
          this.currentPos++;

          while(Transition.q26('q26', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos];
            raster += currentChar;
            if (!this.isEndOfFile()) {
              this.currentPos++;
            } else {
              break;
            }
          }

          if (this.isEndOfFile() || Comparator.isBreakline(this.input[this.currentPos])) {
            this.errors.push({ error: "BadlyFormattedString", lexeme: raster, line: this.lineNumber })
            this.currentPos++;
            this.state = 0;
          } else if (Transition.q26('q27', this.input[this.currentPos])) {
            this.state = 27;
          } else if (Transition.q26('q29', this.input[this.currentPos])) {
            this.state = 29;
          } 
          break;
        case 27:         
          while(Transition.q27('q27', this.input[this.currentPos])) {
            currentChar = this.input[this.currentPos];
            raster += currentChar;
            if (!this.isEndOfFile()) {
              this.currentPos++;
            } else {
              break;
            }
          }
          
          if (Transition.q27('q26', this.input[this.currentPos])) {
            this.state = 26;
          } else if (Transition.q27('q28', this.input[this.currentPos])) {
            this.state = 28;
          } else if (this.isEndOfFile() || Comparator.isBreakline(this.input[this.currentPos])) {
            this.errors.push({ error: "BadlyFormattedString", lexeme: raster, line: this.lineNumber })
            this.currentPos++;
            this.state = 0;
          }
          break;
        case 28:
          raster += this.input[this.currentPos];

          
          if (this.isEndOfFile() || Comparator.isBreakline(this.input[this.currentPos])) {
            this.errors.push({ error: "BadlyFormattedString", lexeme: raster, line: this.lineNumber })
            this.currentPos++;
            this.state = 0;
          } else {
            this.currentPos++;
            if (Transition.q28('q26', this.input[this.currentPos])) {
              this.state = 26;
            } else if (Transition.q28('q29', this.input[this.currentPos])){
              this.state = 29;
            } 
          }
          break;
        case 29:
          raster += this.input[this.currentPos];

          if(Comparator.isValidString(raster)) {
            this.tokens.push({ token: "String", lexeme: raster, line: this.lineNumber, customCode: 11 });
          } else {
            this.errors.push({ error: "BadlyFormattedString", lexeme: raster, line: this.lineNumber })
          }
          this.currentPos++;
          this.state = 0;
          break;
        default:
          break;
      }
    } while (this.currentPos < this.input.length);

    console.table(this.tokens)
    console.table(this.errors)

    this.writeFile();
  }

  isEndOfFile () {
    return this.currentPos + 1 >= this.input.length;
  }

  writeFile () {
    let filenumber = this.filename.split('entrada').join('').split('.txt')[0];
    const logger = fs.createWriteStream(path.resolve("output", `saida${filenumber}.txt`), { flags: 'a' })
    logger.write(`Lista de Tokens:\n`)
    this.tokens.forEach(token => {
      logger.write(`${token.line} ${token.lexeme} ${token.token}\n`)
    });
    logger.write(`\nLista de Erros:\n`)
    this.errors.forEach(error => {
      logger.write(`${error.line} ${error.lexeme} ${error.error}\n`)
    });
    logger.end();
  }
}

module.exports = LexicalAnalyzer;