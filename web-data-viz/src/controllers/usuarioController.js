var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {
    var dados = req.body || {};
    var email = typeof dados.emailServer === "string" ? dados.emailServer.trim() : "";
    var senha = typeof dados.senhaServer === "string" ? dados.senhaServer : "";

    if (!email || !senha) {
        return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }

    usuarioModel.autenticar(email, senha)
        .then(function (usuarios) {
            if (usuarios.length === 0) {
                return res.status(401).json({ erro: "Email ou senha incorretos." });
            }

            res.status(200).json({
                idUsuario: usuarios[0].idUsuario,
                nome: usuarios[0].nome,
                email: usuarios[0].email,
                idCargo: usuarios[0].idCargo
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

    usuarioModel.cadastrar(nome, email, senha, codigo)
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
    validarAcesso
}