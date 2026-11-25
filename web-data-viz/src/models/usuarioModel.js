var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT idUsuario, nome, email, idCargo
        FROM usuario
        WHERE email = ? AND senha = ?;
    `;
    return database.executar(instrucaoSql, [email, senha]);
}

function cadastrar(nome, email, senha, idCargo) {
     if (!idCargo) {
        idCargo = 'USER0001';
    }
    
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, idCargo)
        VALUES (?, ?, ?, ?);
    `;
    
    return database.executar(instrucaoSql, [nome, email, senha, idCargo]);
}

function verificarPermissao(idUsuario) {
    var instrucaoSql = `
        SELECT idUsuario, nome, email, idCargo
        FROM usuario
        WHERE idUsuario = ?;
    `;
    return database.executar(instrucaoSql, [idUsuario]);
}

module.exports = {
    autenticar,
    cadastrar,
    verificarPermissao
};
