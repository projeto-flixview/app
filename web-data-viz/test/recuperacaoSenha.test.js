var test = require("node:test");
var assert = require("node:assert/strict");
var crypto = require("node:crypto");
var recuperacaoModel = require("../src/models/recuperacaoSenhaModel");
var emailService = require("../src/services/emailService");
var recuperacaoService = require("../src/services/recuperacaoSenhaService");
var senhaService = require("../src/services/senhaService");
var usuarioModel = require("../src/models/usuarioModel");
var usuarioController = require("../src/controllers/usuarioController");
var enviarRecuperacaoReal = emailService.enviarRecuperacao;

var contas;
var tokens;
var emails;
var ultimasSolicitacoes;

test.beforeEach(function () {
    contas = { "teste@flixview.com": { idUsuario: 1, nome: "Teste", email: "teste@flixview.com" } };
    tokens = new Map();
    emails = [];
    ultimasSolicitacoes = new Map();
    recuperacaoModel.criarToken = async function (email, hash, expiracao) {
        var usuario = contas[email];
        if (!usuario) return null;
        var ultima = ultimasSolicitacoes.get(email) || 0;
        if (Date.now() - ultima < 60000) return { usuario: usuario, tokenCriado: false };
        ultimasSolicitacoes.set(email, Date.now());
        tokens.set(hash, { idUsuario: usuario.idUsuario, expiracao: expiracao, utilizado: false });
        return { usuario: usuario, tokenCriado: true };
    };
    recuperacaoModel.validarToken = async function (hash) {
        var token = tokens.get(hash);
        return Boolean(token && !token.utilizado && token.expiracao > new Date());
    };
    recuperacaoModel.invalidarToken = async function (hash) {
        var token = tokens.get(hash);
        if (token) token.utilizado = true;
    };
    recuperacaoModel.redefinirSenha = async function (hash, senhaHash) {
        var token = tokens.get(hash);
        if (!token || token.utilizado || token.expiracao <= new Date()) return false;
        token.utilizado = true;
        token.senhaHash = senhaHash;
        return true;
    };
    emailService.enviarRecuperacao = async function (usuario, token) { emails.push({ usuario: usuario, token: token }); };
});

test("e-mail aponta APP_BASE_URL ausente antes de montar o link", async function () {
    var valorAnterior = process.env.APP_BASE_URL;
    delete process.env.APP_BASE_URL;
    try {
        await assert.rejects(enviarRecuperacaoReal({ email: "teste@flixview.com" }, "token"), /APP_BASE_URL/);
    } finally {
        if (valorAnterior === undefined) delete process.env.APP_BASE_URL;
        else process.env.APP_BASE_URL = valorAnterior;
    }
});

test("e-mails existente e inexistente recebem mesma resposta, e o token persistido é hash", async function () {
    var respostaExistente = await recuperacaoService.solicitar("teste@flixview.com");
    var respostaInexistente = await recuperacaoService.solicitar("ausente@flixview.com");
    assert.equal(respostaExistente, respostaInexistente);
    await new Promise(function (resolve) { setImmediate(resolve); });
    assert.equal(emails.length, 1);
    var hash = recuperacaoService.hashToken(emails[0].token);
    assert.equal(tokens.has(hash), true);
    assert.notEqual(hash, emails[0].token);
    assert.equal(tokens.get(hash).expiracao.getTime() > Date.now(), true);
});

test("token válido altera senha e não pode ser reutilizado", async function () {
    var token = crypto.randomBytes(32).toString("hex");
    var hash = recuperacaoService.hashToken(token);
    tokens.set(hash, { idUsuario: 1, expiracao: new Date(Date.now() + 60000), utilizado: false });
    await recuperacaoService.redefinir({ token: token, novaSenha: "NovaSenha1!", confirmarSenha: "NovaSenha1!" });
    assert.match(tokens.get(hash).senhaHash, /^scrypt\$/);
    await assert.rejects(recuperacaoService.redefinir({ token: token, novaSenha: "NovaSenha1!", confirmarSenha: "NovaSenha1!" }), /inválido ou expirado/);
});

test("validação só autoriza token existente, não expirado e não utilizado", async function () {
    var token = crypto.randomBytes(32).toString("hex");
    var hash = recuperacaoService.hashToken(token);
    tokens.set(hash, { idUsuario: 1, expiracao: new Date(Date.now() + 60000), utilizado: false });
    assert.equal(await recuperacaoService.validarToken(token), true);
    assert.equal(await recuperacaoService.validarToken("inválido"), false);
    tokens.get(hash).expiracao = new Date(Date.now() - 1000);
    assert.equal(await recuperacaoService.validarToken(token), false);
    tokens.get(hash).expiracao = new Date(Date.now() + 60000);
    tokens.get(hash).utilizado = true;
    assert.equal(await recuperacaoService.validarToken(token), false);
});

test("reenvio dentro do intervalo não cria nem envia outro token", async function () {
    var primeira = await recuperacaoService.solicitar("teste@flixview.com");
    var segunda = await recuperacaoService.solicitar("teste@flixview.com");
    assert.equal(primeira, segunda);
    await new Promise(function (resolve) { setImmediate(resolve); });
    assert.equal(emails.length, 1);
});

test("token inválido e expirado são rejeitados", async function () {
    await assert.rejects(recuperacaoService.redefinir({ token: "falso", novaSenha: "NovaSenha1!", confirmarSenha: "NovaSenha1!" }), /inválido ou expirado/);
    var token = crypto.randomBytes(32).toString("hex");
    tokens.set(recuperacaoService.hashToken(token), { idUsuario: 1, expiracao: new Date(Date.now() - 1000), utilizado: false });
    await assert.rejects(recuperacaoService.redefinir({ token: token, novaSenha: "NovaSenha1!", confirmarSenha: "NovaSenha1!" }), /inválido ou expirado/);
});

test("senhas diferentes são rejeitadas", async function () {
    var token = crypto.randomBytes(32).toString("hex");
    await assert.rejects(recuperacaoService.redefinir({ token: token, novaSenha: "NovaSenha1!", confirmarSenha: "OutraSenha2!" }), /não coincidem/);
});

test("login aceita hash scrypt criado na redefinição", async function () {
    var senhaHash = await senhaService.gerarHash("NovaSenha1!");
    usuarioModel.autenticar = async function () { return [{ idUsuario: 7, nome: "Teste", email: "teste@flixview.com", idCargo: "USER0001", senha: senhaHash }]; };
    var resposta = await new Promise(function (resolve) {
        var res = { status: function (status) { this.statusCode = status; return this; }, json: function (json) { resolve({ status: this.statusCode, json: json }); } };
        usuarioController.autenticar({ body: { emailServer: "teste@flixview.com", senhaServer: "NovaSenha1!" } }, res);
    });
    assert.equal(resposta.status, 200);
});
