var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT idUsuario, nome, email, senha, idCargo
        FROM usuario
        WHERE email = ?;
    `;
    return database.executar(instrucaoSql, [email]);
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

function atualizarSenha(idUsuario, senhaHash) {
    var instrucaoSql = "UPDATE usuario SET senha = ? WHERE idUsuario = ?;";
    return database.executar(instrucaoSql, [senhaHash, idUsuario]);
}

module.exports = {
    autenticar,
    cadastrar,
    verificarPermissao,
    atualizarSenha
};
