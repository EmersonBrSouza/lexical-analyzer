const chalk = require('chalk').default;

var errors = {
    '0001': { 
        type: "Invalid Entry",
        message: function ({ filename }) {
            return `${chalk.red("Entrada Inválida")} | O arquivo ${filename ? chalk.yellow(filename) : 'de entrada'} não pode ser lido.`
        }
    }
}

module.exports = {
    getErrorTypeById: function (id) {
        return errors[id].type;
    },
    getErrorMessageById: function (id, args = {}) {
        return errors[id].message(args);
    }
}
