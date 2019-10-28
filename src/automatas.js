const { reserved, delimiters, numbers, identifier } = require("./definitions");

var state = 0;

function declarationAutomata (line, lineNumber) {
	let chunks = line.split("");
	let raster = "";
	let tokens = [];
	let errors = [];

	for (var i = 0; i < chunks.length; i++) {
		
		// console.log(`State ${state} | Chunk: ${chunks[i]}`);
		function reset () {
			state = 0;
			raster = "";
		}

		switch (state) {
			case 0:
				raster += chunks[i];
				if (reserved.includes(raster)) {
					state = 1;
				}
				break;
			case 1: // Reconhece uma palavra reservada
				if ((isSpace(chunks[i]) || isDelimiter(chunks[i])) && reserved.includes(raster)) {
					console.log(`Token ${raster} reconhecido`);
					tokens.push({ token: "Reserved Word", lexeme: raster, line: lineNumber })
					reset();
				} else {
					raster += chunks[i];
					state = 2;
				}
				break;
			case 2: // Reconhece um identificador
				if (isSpace(chunks[i]) || isDelimiter(chunks[i])) {
					if (identifier.test(raster)) {
						console.log(`Token ${raster} reconhecido`);
						tokens.push({ token: "Identifier", lexeme: raster, line: lineNumber })
						reset();
					} else {
						console.log('Error')
					}
				} else {
					raster += chunks[i]
				}
				break;
			default:
				break;
		}
	}

	return { tokens, errors }
}

function isSpace(char) {
	return char.charCodeAt(0) == 9 || char.charCodeAt(0) == 32;
}

function isDelimiter(char) {
	return delimiters.includes(char);
}

module.exports = { declarationAutomata };
