const Comparator = require('./comparator')

class Transition {
  static q0 (destiny, args) {
    if (destiny == "q1") {
      return Comparator.isLetter(args);
    } else if (destiny == "q2") {
      return args === "*"
    } else if (destiny == "q3") {
      return args ===  "-"
    } else if (destiny == "q10") {
      return args ===  "/"
    }
  }

  static q1 (destiny, args) {
    const consumableChars = ['@', '$', "'", ':', '.', ',', '_', '^', '%', '?', '#', '\\']
    if (destiny == "q1") {
      return Comparator.isLetter(args) || Comparator.isDigit(args) || consumableChars.includes(args);
    }
  }

  static q2 (destiny, args) {
    if (destiny == "q2") {
      return args === "*"
    }
  }

  static q3 (destiny, args) {
    if (destiny == "q3") {
      return Comparator.isLetter(args);
    } else if (destiny == "q4") {
      return args === "-"
    } else if (destiny == "q5") {
      return Comparator.isDigit(args)
    } else if (destiny == "q8") {
      return Comparator.isWhiteSpace(args);
    }
  }

  static q5 (destiny, args) {
    if (destiny == "q5") {
      return Comparator.isDigit(args)
    } else if (destiny == "q6") {
      return args === "."
    }
  }

  static q6 (destiny, args) {
    if (destiny == "q7") {
      return !Comparator.isWhiteSpace(args) && !Comparator.isBreakline(args);
    }
  }

  static q7 (destiny, args) {
    if (destiny == "q7") {
      return Comparator.isDigit(args) || !Comparator.isLetter(args);
    }
  }

  static q8 (destiny, args) {
    if (destiny == "q5") {
      return Comparator.isDigit(args);
    } else if (destiny == "q8") {
      return Comparator.isWhiteSpace(args) || Comparator.isBreakline(args);
    } else if (destiny == "q9") {
      return Comparator.isLetter(args) || Comparator.isWhiteSpace(args) || Comparator.isBreakline(args);
    }
  }

  static q10 (destiny, args) {
    if (destiny == "q10") {
      return args !== '/' && args !== '*';
    } else if (destiny == "q11") {
      return args === '/';
    } else if (destiny == "q12") {
      return args === '*';
    }
  }

  static q11 (destiny, args) {
    if (destiny == "q11") {
      return !Comparator.isBreakline(args);
    }
  }

  static q12 (destiny, args) {
    if (destiny == "q12") {
      return args !== '*'
    } else if (destiny == "q13") {
      return args === '*';
    }
  }

  static q13 (destiny, args) {
    if (destiny == "q12") {
      return args !== '*' && args !== '/';
    } else if (destiny == "q13") {
      return args === '*'
    } else if (destiny == "q14") {
      return args === '/';
    }
  }
}

module.exports = Transition