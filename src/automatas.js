const { reserved, delimiters, numbers, identifier, relational, arithmetic, logical } = require("./definitions");

var state = 0;

function declarationAutomata (line, lineNumber) {
	let chunks = line.split("");
	let raster = "";
	let tokens = [];
	let errors = [];

	for (var i = 0; i < chunks.length; i++) {
		function reset () {
			state = 0;
			raster = "";
		}
		
		console.log(`State ${state} | Chunk: ${chunks[i]} | Raster: ${raster}`);
		switch (state) {
			case 0:
				if (reserved.includes(raster)) {
					state = 1;
					break;
				} else if (relational.includes(raster)) {
					state = 3;
					break;
				} else {
					raster += chunks[i];
				}
			case 1: // Reconhece uma palavra reservada
				if (isBreakpoint(chunks[i]) && reserved.includes(raster)) {
					console.log(`Token ${raster} reconhecido`);
					tokens.push({ token: "Reserved Word", lexeme: raster, line: lineNumber })
					reset();
				} else {
					// raster += chunks[i];
					state = 2;
				}
				break;
			case 2: // Reconhece um identificador
				if (isBreakpoint(chunks[i])) {
					if (identifier.test(raster)) {
						console.log(`Token ${raster} reconhecido`);
						tokens.push({ token: "Identifier", lexeme: raster, line: lineNumber })
						reset();
					} else if (relational.includes(raster)) {
						state = 3;
					} else {
						errors.push({ error: "Error", lexeme: raster, line: lineNumber })
						reset();
					}
				} else {
					raster += chunks[i]
				}
				break;
			case 3:
				if (relational.includes(raster)) {
					console.log(`Token ${raster} reconhecido`);
					tokens.push({ token: "Relational", lexeme: raster, line: lineNumber })
					reset();
				} else {
					errors.push({ error: "Error", lexeme: raster, line: lineNumber })
					reset();
				}
				// else {
				// 	raster += chunks[i]
				// }
				break;
			default:
				break;
		}
	}

	return { tokens, errors }
}

function isBreakpoint (char) {
	return isSpace(char) || isDelimiter(char) || isRelational(char) || isArithmetic(char) || isLogical(char)
}

function isSpace(char) {
	return char.charCodeAt(0) == 9 || char.charCodeAt(0) == 32;
}

function isDelimiter(char) {
	return delimiters.includes(char);
}

function isRelational(char) {
	return relational.includes(char);
}

function isArithmetic(char) {
	return arithmetic.includes(char)
}

function isLogical(char) {
	return logical.includes(char)
}

module.exports = { declarationAutomata };
