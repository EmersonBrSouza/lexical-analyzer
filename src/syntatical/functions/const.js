const Definitions = require('../syntax_definitions');

class Const {
  static const (lexeme, pos) {
    return (lexeme === 'const' && pos == 0) || (lexeme == '{' && pos == 1)
  }

  static typeConst (lexeme, pos) {
    if (pos == 0) {
      return this._type(lexeme);
    } else if (pos == 1) {
      return this._idConst(lexeme);
    }
  }

  _type (lexeme) {
    return Definitions.types.includes(lexeme)
  }

  static idConst () {

  }

  static value () {

  }

  static const2 () {

  }

  static const3 () {

  }
}