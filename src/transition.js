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
    } else if (destiny == "q16") {
      return args ===  "+"
    } else if (destiny == "q17") {
      return Comparator.isDelimiter(args);
    } else if (destiny == "q18") {
      return args ===  "!"
    } else if (destiny == "q20") {
      return args ===  "="
    } else if (destiny == "q21") {
      return [">", "<"].includes(args);
    } else if (destiny == "q22") {
      return args ===  "&";
    } else if (destiny == "q24") {
      return args === "|"
    } else if (destiny == "q26") {
      return args === '"'
    }
  }

  static q1 (destiny, args) {
    const consumableChars = ['@', '$', "'", ':', '_', '^', '%', '?', '#', '\\']
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
      return !Comparator.isWhiteSpace(args) && !Comparator.isBreakline(args);
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

  static q15 (destiny, args) {
    if (destiny == "q15") {
      return args !== '+';
    } else if (destiny == "q16") {
      return args === '+'
    }
  }

  static q17 (destiny, args) {
    if (destiny == "q17") {
      return Comparator.isDelimiter(args);
    }
  }

  static q18 (destiny, args) {
    if (destiny == "q18") {
      return args !== "="
    } else if (destiny == "q19") {
      return args === "="
    }
  }

  static q19 (destiny, args) {
    if (destiny == "q19") {
      return args === "="
    }
  }

  static q20 (destiny, args) {
    if (destiny == "q19") {
      return args === "="
    } else if (destiny == "q20") {
      return args !== "="
    }  
  }

  static q21 (destiny, args) {
    if (destiny == "q19") {
      return args === "="
    } else if (destiny == "q21") {
      return args !== "="
    }  
  }

  static q22 (destiny, args) {
    if (destiny == "q22") {
      return args !== "&"
    } else if (destiny == "q23") {
      return args === "&"
    } 
  }

  static q23 (destiny, args) {
    if (destiny == "q23") {
      return args === "&"
    } 
  }

  static q24 (destiny, args) {
    if (destiny == "q24") {
      return args !== "|"
    } else if (destiny == "q25") {
      return args === "|"
    }  
  }

  static q25 (destiny, args) {
    if (destiny == "q25") {
      return args === "|"
    }
  }

  static q26 (destiny, args) {
    if (destiny == "q26") {
      return !Comparator.isBreakline(args) && args !== '\\' && args !== '"'
    } else if (destiny == "q27") {
      return args === '\\'
    } else if (destiny == "q29") {
      return args === '"'
    }
  }

  static q27 (destiny, args) {
    if (destiny == "q26") {
      return args !== '\\' && args !== '"'
    } else if (destiny == "q27") {
      return args === '\\'
    } else if (destiny == "q28") {
      return args === '"'
    }
  }

  static q28 (destiny, args) {
    if (destiny == "q26") {
      return args !== '"' && args !== '\n'
    } else if (destiny == "q29") {
      return args === '"'
    }
  }
}

module.exports = Transition