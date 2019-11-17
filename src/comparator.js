const { letter, identifier, reserved, digit, numbers, blockComment, delimiters, strings } = require('./definitions');

class Comparator {
  static isLetter (char) {
    return letter.test(char);
  }

  static isIdentifier (string) {
    return identifier.test(string)
  }

  static isReservedWord (string) {
    return reserved.includes(string)
  }
  
  static isDigit (char) {
    return digit.test(char)
  }

  static isBreakline (char) {
    return char === '\n'
  }

  static isWhiteSpace (char) {
    return new String(char).charCodeAt(0) == 9 || new String(char).charCodeAt(0) == 32 
  }

  static isValidNumber (string) {
    return numbers.test(string)
  }

  static isValidString (string) {
    return strings.test(string);
  }

  static isBlockComment (string) {
    return blockComment.test(string)
  }

  static isDelimiter (string) {
    return delimiters.includes(string)
  }
}

module.exports = Comparator;