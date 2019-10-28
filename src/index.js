const fs = require("fs");
const lineReader = require('line-reader');
const path = require("path");
const chalk = require("chalk").default;
const errors = require("./errors");
const { declarationAutomata } = require("./automatas");

const inputPath = path.resolve("input");
const outputPath = path.resolve("output", "output.txt");
const fileRegex = new RegExp(/entrada(\d+)(.txt)/, "g");

fs.truncateSync(outputPath, 0);

const files = fs.readdirSync(inputPath, { withFileTypes: true });

files.forEach(file => {
  if (!file.name.match(fileRegex)) {
    printError("0001", { filename: file.name });
  } else {
		console.log(chalk.blueBright(`Analisando ${file.name}`));
		var currentLine = 0;
		lineReader.eachLine(path.resolve(inputPath, file.name), function(line) {
			currentLine += 1;
			console.log(declarationAutomata(line, currentLine));
			// const words = line.split(' ');
			// words.forEach((word) => {
			// 	writeOutputLine('token', { token: 'ata', lexeme: word, line: currentLine })
			// })
		});
  }
});

function printError(type, args) {
  console.log(errors.getErrorMessageById(type, args));
}

function writeOutputLine (type, args) {
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