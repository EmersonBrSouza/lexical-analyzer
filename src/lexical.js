const fs = require('fs');
const Transition = require('./transition');
const Comparator = require('./comparator');

class LexicalAnalyzer {

  constructor (input) {
    if (!input) {
      throw new Error("O analisador léxico precisa de um arquivo válido")
    }
    this.input = input;
    this.currentPos = 0;
    this.lineNumber = 1;
    this.state = 0;
    this.errors = [];
    this.tokens = [];
  }

  startAnalisis() {
    let raster = "";
    let tokens = [];
    let errors = [];

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
              tokens.push({ token: "Reserved Word", lexeme: raster, line: this.lineNumber, customCode: 0 })
            } else {
              tokens.push({ token: "Identifier", lexeme: raster, line: this.lineNumber, customCode: 3 })
            }
          } else {
            errors.push({ error: "BadlyFormattedIdentifier", lexeme: raster, line: this.lineNumber })
          }
          this.state = 0;
          break;
        case 2:
          raster = currentChar;
          if (Transition.q2('q2', raster)) {
            tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 });
            this.currentPos++;
            this.state = 0
          }
          break;
        case 3:
          raster += currentChar;
          this.currentPos++;
          currentChar = this.input[this.currentPos];
          
          if (Transition.q3('q3', currentChar)) {
            tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
            this.state = 0;
          } else if (Transition.q3('q4', currentChar)) {
            this.state = 4;
          } else if (Transition.q3('q5', currentChar)) {
            this.state = 5;
          } else if (Transition.q3('q8', currentChar)) {
            this.state = 8;
          } else if(this.isEndOfFile()) {
            tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
            this.state = 0;
          }
          break;
        case 4:
          raster += currentChar;
          tokens.push({ token: "Arithmetic Increment Operator", lexeme: raster, line: this.lineNumber, customCode: 9 });
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
            tokens.push({ token: "Number", lexeme: raster, line: this.lineNumber, customCode: 2 });
            this.currentPos++;
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
            errors.push({ token: "BadlyFormattedNumber", lexeme: raster, line: this.lineNumber });
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
            tokens.push({ token: "Number", lexeme: raster, line: this.lineNumber, customCode: 1 });
          } else {
            errors.push({ error: "BadlyFormattedNumber", lexeme: raster, line: this.lineNumber });
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
          tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
          this.state = 0;
          break;
        case 10:
          raster = currentChar;
          this.currentPos++;

          if (Transition.q10('q10', this.input[this.currentPos])) {
            tokens.push({ token: "Arithmetic Operator", lexeme: raster, line: this.lineNumber, customCode: 8 })
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
            tokens.push({ token: "Line Comment", lexeme: raster, line: this.lineNumber, customCode: 10 })
          } else {
            errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
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
            errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
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
            errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
            this.currentPos++;
            this.state = 0;
          } else if (Transition.q13('q12', this.input[this.currentPos])) {
            this.state = 12;
          }
          break;
        case 14:
          raster += this.input[this.currentPos];
          if (Comparator.isBlockComment(raster)) {
            tokens.push({ token: "Block Comment", lexeme: raster, line: this.lineNumber, customCode: 10 })
          } else {
            errors.push({ error: "WrongComment", lexeme: raster, line: this.lineNumber })
          }
          this.currentPos++;
          this.state = 0;
          break;
        default:
          break;
      }
    } while (this.currentPos < this.input.length);

    console.table(tokens)
    console.table(errors)
  }

  isEndOfFile () {
    return this.currentPos + 1 >= this.input.length;
  }

  writeLine (type, args) {
    const logger = fs.createWriteStream(outputPath, { flags: 'a' })	
    if (type === 'error') {
      var { error, lexeme, line } = args
      logger.write(`${line} ${lexeme} ${error};\r\n`);
    } else if (type === 'token') {
      var { token, lexeme, line } = args
      logger.write(`${line} ${lexeme} ${token};\r\n`);
    }
    logger.end();
  }
}

module.exports = LexicalAnalyzer;