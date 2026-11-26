var crypto = require("crypto");
var recuperacaoModel = require("../models/recuperacaoSenhaModel");
var senhaService = require("./senhaService");
var emailService = require("./emailService");

var DURACAO_TOKEN_MS = 30 * 60 * 1000;
var RESPOSTA_GENERICA = "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.";

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

async function solicitar(email) {
    if (typeof email !== "string" || email.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        var erroValidacao = new Error("Informe um e-mail válido.");
        erroValidacao.status = 400;
        throw erroValidacao;
    }

    var token = crypto.randomBytes(32).toString("hex");
    var tokenHash = hashToken(token);
    var expiracao = new Date(Date.now() + DURACAO_TOKEN_MS);
    var solicitacao = await recuperacaoModel.criarToken(email.trim(), tokenHash, expiracao);
    if (solicitacao && solicitacao.tokenCriado) {
        setImmediate(async function () {
            try {
                await emailService.enviarRecuperacao(solicitacao.usuario, token);
            } catch (erro) {
                try {
                    await recuperacaoModel.invalidarToken(tokenHash);
                } catch (erroInvalidacao) {
                    console.error("Não foi possível invalidar token sem entrega de e-mail:", erroInvalidacao.message);
                }
                console.error("Não foi possível enviar e-mail de recuperação:", erro.message);
            }
        });
    }
    return RESPOSTA_GENERICA;
}

async function validarToken(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) return false;
    return recuperacaoModel.validarToken(hashToken(token));
}

async function redefinir(dados) {
    var token = dados && typeof dados.token === "string" ? dados.token.trim() : "";
    var senha = dados && typeof dados.novaSenha === "string" ? dados.novaSenha : "";
    var confirmacao = dados && typeof dados.confirmarSenha === "string" ? dados.confirmarSenha : "";
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        var erroToken = new Error("Link inválido ou expirado. Solicite uma nova recuperação.");
        erroToken.status = 400;
        throw erroToken;
    }
    if (!senhaService.validarSenha(senha)) {
        var erroSenha = new Error("A senha deve ter de 5 a 50 caracteres, incluindo maiúscula, minúscula, número e caractere especial.");
        erroSenha.status = 400;
        throw erroSenha;
    }
    if (!confirmacao || senha !== confirmacao) {
        var erroConfirmacao = new Error("As senhas não coincidem.");
        erroConfirmacao.status = 400;
        throw erroConfirmacao;
    }

    var senhaHash = await senhaService.gerarHash(senha);
    var sucesso = await recuperacaoModel.redefinirSenha(hashToken(token), senhaHash);
    if (!sucesso) {
        var erroInvalido = new Error("Link inválido ou expirado. Solicite uma nova recuperação.");
        erroInvalido.status = 400;
        throw erroInvalido;
    }
    return true;
}

module.exports = { solicitar: solicitar, validarToken: validarToken, redefinir: redefinir, hashToken: hashToken };
