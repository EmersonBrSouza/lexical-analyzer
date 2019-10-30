const {
	reserved,
	delimiters,
	numbers,
	identifier,
	relational,
	arithmetic,
	logical,
	letter,
	digit
} = require("./definitions");

var state = 0;

function declarationAutomata (line, lineNumber) {
	let chunks = line.split("");
	let currentPos = 0;
	let raster = "";
	let tokens = [];
	let errors = [];

	do {
		console.log(`State ${state} | Chunk: ${chunks[currentPos]} | Raster: ${raster}`);
		switch (state) {
			case 0:
				raster = chunks[currentPos];
				if (isLetter(chunks[currentPos])) {
					currentPos++;
					state = 1;
				} else if (isDelimiter(chunks[currentPos])) {
					state = 2;
				} else if (isArithmetic(chunks[currentPos])) {
					state = 3;
				} else if (isRelational(chunks[currentPos])) {
					state = 4;
				} else {
					currentPos++;
				}
				break;
			case 1:
				while (isLetter(chunks[currentPos]) || isDigit(chunks[currentPos]) || isUnderscore(chunks[currentPos])) {
					raster += chunks[currentPos];
					currentPos++;
				}

				if (isIdentifier(raster)) {
					if (isReservedWord(raster)) {
						tokens.push({ token: "Reserved Word", lexeme: raster, line: lineNumber });
					} else {
						tokens.push({ token: "Identifier", lexeme: raster, line: lineNumber });
					}
				}
				state = 0;
				break;
			case 2:
				if (isDelimiter(raster)) {
					tokens.push({ token: "Delimiter", lexeme: raster, line: lineNumber });
					currentPos++;
					state = 0
				}
				break;
			case 3:
				if (isArithmetic(raster)) {
					tokens.push({ token: "Arithmetic", lexeme: raster, line: lineNumber });
					currentPos++;
					state = 0
				}
			case 4:
				if (isRelational(raster)) {
					tokens.push({ token: "Relational", lexeme: raster, line: lineNumber });
					currentPos++;
					state = 0
				}
			default:
				break;
		}
	} while (currentPos < chunks.length);
	return { tokens, errors };
}

function isBreakpoint (char) {
	return (
		isSpace(char) ||
		isDelimiter(char) ||
		isRelational(char) ||
		isArithmetic(char) ||
		isLogical(char)
	);
}

function isSpace (char) {
	return char.charCodeAt(0) == 9 || char.charCodeAt(0) == 32;
}

function isDelimiter (char) {
	return delimiters.includes(char);
}

function isRelational (char) {
	return relational.includes(char);
}

function isArithmetic (char) {
	return arithmetic.includes(char);
}

function isLogical (char) {
	return logical.includes(char);
}

function isLetter (char) {
	return letter.test(char);
}

function isDigit (char) {
	return digit.test(char);
}

function isUnderscore (char) {
	return char === "_";
}

function isIdentifier (char) {
	return identifier.test(char);
}

function isReservedWord (char) {
	return reserved.includes(char);
}
module.exports = { declarationAutomata };
