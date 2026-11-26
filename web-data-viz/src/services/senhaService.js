var crypto = require("crypto");
var util = require("util");
var scrypt = util.promisify(crypto.scrypt);

var PARAMETROS = { N: 16384, r: 8, p: 1, tamanho: 32 };

function validarSenha(senha) {
    return typeof senha === "string" && senha.length >= 5 && senha.length <= 50 &&
        /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /\d/.test(senha) && /[^A-Za-z0-9]/.test(senha);
}

async function gerarHash(senha) {
    var sal = crypto.randomBytes(16);
    var hash = await scrypt(senha, sal, PARAMETROS.tamanho, {
        N: PARAMETROS.N, r: PARAMETROS.r, p: PARAMETROS.p, maxmem: 64 * 1024 * 1024
    });
    return ["scrypt", PARAMETROS.N, PARAMETROS.r, PARAMETROS.p, sal.toString("hex"), hash.toString("hex")].join("$");
}

async function verificar(senha, hashArmazenado) {
    if (typeof hashArmazenado !== "string" || hashArmazenado.indexOf("scrypt$") !== 0) return false;
    var partes = hashArmazenado.split("$");
    if (partes.length !== 6) return false;
    var n = Number(partes[1]);
    var r = Number(partes[2]);
    var p = Number(partes[3]);
    var sal = Buffer.from(partes[4], "hex");
    var esperado = Buffer.from(partes[5], "hex");
    if (!Number.isSafeInteger(n) || n < 2 || !Number.isSafeInteger(r) || r < 1 ||
        !Number.isSafeInteger(p) || p < 1 || sal.length !== 16 || esperado.length !== PARAMETROS.tamanho) return false;
    var obtido = await scrypt(senha, sal, esperado.length, { N: n, r: r, p: p, maxmem: 64 * 1024 * 1024 });
    return crypto.timingSafeEqual(esperado, obtido);
}

module.exports = { gerarHash: gerarHash, verificar: verificar, validarSenha: validarSenha };
