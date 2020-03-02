/**
 * This file contains the Compiler procedures to start
 * 
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default;

const LexicalAnalyzer = require('./lexical');
const SyntaticalAnalyzer = require('./syntatical');
const inputPath = path.resolve("input");
const outputPath = path.resolve("output");
const fileRegex = new RegExp(/entrada(\d+)(.txt)/, "g");

class Compiler {
  
  constructor () {
    this.clearOutputCache();
  }
  
  startLexicalAnalisys () {
    const files = fs.readdirSync(inputPath, { withFileTypes: true });
    console.log(`${chalk.green("Iniciando análise léxica...\n")}`)
    files.forEach(file => {
      if (!file.name.match(fileRegex)) {
        console.log(`${chalk.red("Entrada Inválida")} | O arquivo ${file.name} não pode ser lido.`)
      } else {
        const inputFile = fs.readFileSync(path.resolve(inputPath, file.name), "utf-8")
        const lexicalAnalyzer = new LexicalAnalyzer(inputFile, file.name);

        console.log(chalk.yellow(`\nAnalisando ${file.name}`));
        let result = lexicalAnalyzer.startAnalisis();
        this._startSyntaticalAnalisys(result.tokens, file.name);
      }
    });
  }

  _startSyntaticalAnalisys (tokens, filename) {
    const syntaticalAnalyzer = new SyntaticalAnalyzer(tokens, filename);
    syntaticalAnalyzer.startAnalisys();
  }

  clearOutputCache () {
		console.log(`${chalk.blue("Limpando os antigos arquivos de saída... \n")}`)
		const outputDir = fs.readdirSync(outputPath);

		for (const file of outputDir) {
			fs.unlink(path.join(outputPath, file), err => {
				if (err) throw err;
			});
		}
	}
}

module.exports = Compiler;