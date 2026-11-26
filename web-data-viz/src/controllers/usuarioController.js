var usuarioModel = require("../models/usuarioModel");
var senhaService = require("../services/senhaService");
var recuperacaoSenhaService = require("../services/recuperacaoSenhaService");

function autenticar(req, res) {
    var dados = req.body || {};
    var email = typeof dados.emailServer === "string" ? dados.emailServer.trim() : "";
    var senha = typeof dados.senhaServer === "string" ? dados.senhaServer : "";

    if (!email || !senha) {
        return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    usuarioModel.autenticar(email, senha)
        .then(async function (usuarios) {
            if (usuarios.length === 0) return res.status(401).json({ erro: "Email ou senha incorretos." });
            var usuario = usuarios[0];
            var senhaValida;
            if (usuario.senha.indexOf("scrypt$") === 0) {
                senhaValida = await senhaService.verificar(senha, usuario.senha);
            } else {
                senhaValida = senha === usuario.senha;
                if (senhaValida) {
                    await usuarioModel.atualizarSenha(usuario.idUsuario, await senhaService.gerarHash(senha));
                }
            }
            if (!senhaValida) return res.status(401).json({ erro: "Email ou senha incorretos." });

            res.status(200).json({
                idUsuario: usuario.idUsuario,
                nome: usuario.nome,
                email: usuario.email,
                idCargo: usuario.idCargo
            });
        })
        .catch(function (erro) {
            console.error("Houve um erro ao autenticar o usuário:", erro);
            res.status(500).json({ erro: "Não foi possível verificar o login no banco de dados." });
        });

}

function cadastrar(req, res) {
    var dados = req.body || {};
    var nome = typeof dados.nomeServer === "string" ? dados.nomeServer.trim() : "";
    var email = typeof dados.emailServer === "string" ? dados.emailServer.trim() : "";
    var senha = typeof dados.senhaServer === "string" ? dados.senhaServer : "";
    var codigo = typeof dados.codigoServer == "string" ? dados.codigoServer : "";

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Nome, email e senha são obrigatórios." });
    }

    if (nome.length > 100 || email.length > 150 || senha.length > 50) {
        return res.status(400).json({ erro: "Um ou mais campos excedem o tamanho permitido." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ erro: "Informe um email válido." });
    }

    senhaService.gerarHash(senha).then(function (senhaHash) {
        return usuarioModel.cadastrar(nome, email, senhaHash, codigo);
    })
        .then(function (resultado) {
            res.status(201).json({
                idUsuario: resultado.insertId,
                mensagem: "Cadastro realizado com sucesso."
            });
        })
        .catch(function (erro) {
            console.error("Houve um erro ao realizar o cadastro:", erro);
            res.status(500).json({ erro: "Não foi possível salvar o cadastro no banco de dados." });
        });
}

async function solicitarRecuperacao(req, res) {
    var email = req.body && req.body.email;
    try {
        var mensagem = await recuperacaoSenhaService.solicitar(email);
        return res.status(202).json({ mensagem: mensagem });
    } catch (erro) {
        if (erro.status === 400) return res.status(400).json({ erro: erro.message });
        console.error("Falha ao processar solicitação de recuperação de senha:", erro.message);
        return res.status(500).json({ erro: "Não foi possível processar a solicitação agora." });
    }
}

async function redefinirSenha(req, res) {
    try {
        await recuperacaoSenhaService.redefinir(req.body || {});
        return res.status(200).json({ mensagem: "Senha redefinida com sucesso." });
    } catch (erro) {
        if (erro.status === 400) return res.status(400).json({ erro: erro.message });
        console.error("Falha ao redefinir senha:", erro.message);
        return res.status(500).json({ erro: "Não foi possível redefinir a senha agora." });
    }
}

async function validarTokenRecuperacao(req, res) {
    try {
        var valido = await recuperacaoSenhaService.validarToken(req.body && req.body.token);
        if (!valido) return res.status(400).json({ valido: false, erro: "Link inválido, expirado ou já utilizado. Solicite uma nova recuperação." });
        return res.status(200).json({ valido: true });
    } catch (erro) {
        console.error("Falha ao validar token de recuperação:", erro.message);
        return res.status(500).json({ valido: false, erro: "Não foi possível validar o link agora." });
    }
}

function validarAcesso(req, res) {
    var dados = req.body || {};
    var idUsuario = dados.idUsuarioServer || dados.idUsuario;
    var idCargo = dados.idCargoServer || dados.idCargo || dados.codigoAcessoServer || dados.codigoAcesso;

    if (!idUsuario) {
        return res.status(401).json({ permitido: false, mensagem: "Usuário não autenticado." });
    }

    // Se o código informado for USER0001, barra imediatamente
    if (idCargo === "USER0001") {
        return res.status(403).json({
            permitido: false,
            mensagem: "Acesso negado: usuários com código USER0001 não possuem permissão para acessar esta área."
        });
    }

    usuarioModel.verificarPermissao(idUsuario)
        .then(function (resultado) {
            if (resultado.length === 0) {
                return res.status(404).json({ permitido: false, mensagem: "Usuário não encontrado." });
            }

            var usuario = resultado[0];

            if (usuario.idCargo === "USER0001") {
                return res.status(403).json({
                    permitido: false,
                    mensagem: "Acesso negado: usuários com código USER0001 não possuem permissão para acessar esta área."
                });
            }

            res.status(200).json({
                permitido: true,
                mensagem: "Acesso autorizado.",
                idUsuario: usuario.idUsuario,
                nome: usuario.nome,
                idCargo: usuario.idCargo
            });
        })
        .catch(function (erro) {
            console.error("Houve um erro ao validar acesso do usuário no banco:", erro);
            // Fallback caso banco esteja offline, mas cargo do token/sessão foi validado
            if (idCargo && idCargo !== "USER0001") {
                return res.status(200).json({
                    permitido: true,
                    mensagem: "Acesso autorizado."
                });
            }
            res.status(500).json({ permitido: false, erro: "Não foi possível verificar as permissões do usuário." });
        });
}

module.exports = {
    autenticar,
    cadastrar,
    validarAcesso,
    solicitarRecuperacao,
    redefinirSenha,
    validarTokenRecuperacao
}
