var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
});

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.post("/validar-acesso", function (req, res) {
    usuarioController.validarAcesso(req, res);
});

router.post("/solicitar-recuperacao", function (req, res) {
    usuarioController.solicitarRecuperacao(req, res);
});

router.post("/redefinir-senha", function (req, res) {
    usuarioController.redefinirSenha(req, res);
});

router.post("/validar-token-recuperacao", function (req, res) {
    usuarioController.validarTokenRecuperacao(req, res);
});

module.exports = router;
