var database = require("../database/config");

async function criarToken(email, hashToken, expiracao) {
    var conexao = await database.obterConexao();
    try {
        await conexao.beginTransaction();
        var usuarios = await conexao.execute("SELECT idUsuario, nome, email FROM usuario WHERE email = ? LIMIT 1 FOR UPDATE;", [email]);
        if (usuarios[0].length === 0) {
            await conexao.commit();
            return null;
        }
        var usuario = usuarios[0][0];
        var recentes = await conexao.execute(
            "SELECT idRecuperacao FROM recuperacaoSenha WHERE fkUsuario = ? AND dataCriacao > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 60 SECOND) LIMIT 1;",
            [usuario.idUsuario]
        );
        if (recentes[0].length > 0) {
            await conexao.commit();
            return { usuario: usuario, tokenCriado: false };
        }
        await conexao.execute("UPDATE recuperacaoSenha SET dataUtilizacao = CURRENT_TIMESTAMP WHERE fkUsuario = ? AND dataUtilizacao IS NULL;", [usuario.idUsuario]);
        await conexao.execute("INSERT INTO recuperacaoSenha (fkUsuario, token, dataExpiracao) VALUES (?, ?, ?);", [usuario.idUsuario, hashToken, expiracao]);
        await conexao.commit();
        return { usuario: usuario, tokenCriado: true };
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }
}

async function validarToken(hashToken) {
    var resultado = await database.executar(
        "SELECT idRecuperacao FROM recuperacaoSenha WHERE token = ? AND dataUtilizacao IS NULL AND dataExpiracao > CURRENT_TIMESTAMP LIMIT 1;",
        [hashToken]
    );
    return resultado.length > 0;
}

async function invalidarToken(hashToken) {
    return database.executar(
        "UPDATE recuperacaoSenha SET dataUtilizacao = CURRENT_TIMESTAMP WHERE token = ? AND dataUtilizacao IS NULL;",
        [hashToken]
    );
}

async function redefinirSenha(hashToken, senhaHash) {
    var conexao = await database.obterConexao();
    try {
        await conexao.beginTransaction();
        var tokens = await conexao.execute(
            "SELECT idRecuperacao, fkUsuario FROM recuperacaoSenha WHERE token = ? AND dataUtilizacao IS NULL AND dataExpiracao > CURRENT_TIMESTAMP LIMIT 1 FOR UPDATE;",
            [hashToken]
        );
        if (tokens[0].length === 0) {
            await conexao.rollback();
            return false;
        }
        var token = tokens[0][0];
        await conexao.execute("UPDATE usuario SET senha = ? WHERE idUsuario = ?;", [senhaHash, token.fkUsuario]);
        await conexao.execute("UPDATE recuperacaoSenha SET dataUtilizacao = CURRENT_TIMESTAMP WHERE fkUsuario = ? AND dataUtilizacao IS NULL;", [token.fkUsuario]);
        await conexao.commit();
        return true;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }
}

module.exports = { criarToken: criarToken, validarToken: validarToken, invalidarToken: invalidarToken, redefinirSenha: redefinirSenha };
