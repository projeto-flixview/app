var transporte;

function obterTransporte() {
    var obrigatorias = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM", "APP_BASE_URL"];
    var ausentes = obrigatorias.filter(function (nome) {
        return typeof process.env[nome] !== "string" || process.env[nome].trim() === "";
    });
    if (ausentes.length) throw new Error("Configuração de e-mail incompleta: " + ausentes.join(", "));
    var porta = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
        throw new Error("SMTP_PORT deve ser uma porta válida entre 1 e 65535.");
    }
    var urlBase;
    try {
        urlBase = new URL(process.env.APP_BASE_URL.trim());
    } catch (erro) {
        throw new Error("APP_BASE_URL deve conter uma URL HTTP ou HTTPS válida.");
    }
    if (urlBase.protocol !== "http:" && urlBase.protocol !== "https:") {
        throw new Error("APP_BASE_URL deve usar HTTP ou HTTPS.");
    }
    if (!transporte) {
        var nodemailer = require("nodemailer");
        transporte = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: porta,
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        });
    }
    return transporte;
}

function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, function (caractere) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere];
    });
}

async function enviarRecuperacao(usuario, token) {
    // Valida SMTP e APP_BASE_URL antes de montar o link para reportar a chave ausente.
    var transporteAtivo = obterTransporte();
    var baseUrl = process.env.APP_BASE_URL.trim().replace(/\/$/, "");
    var link = baseUrl + "/html/recuperacao-senha.html?token=" + encodeURIComponent(token);
    var nome = escaparHtml(usuario.nome || "");
    await transporteAtivo.sendMail({
        from: process.env.SMTP_FROM,
        to: usuario.email,
        subject: "Recuperação de senha | FlixView",
        text: "Olá" + (usuario.nome ? " " + usuario.nome : "") + ",\n\nUse este link para redefinir sua senha (válido por 30 minutos):\n" + link + "\n\nSe você não solicitou esta alteração, ignore este e-mail.",
        html: "<div style=\"font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto\"><h1>Recuperação de senha</h1><p>Olá " + nome + ",</p><p>Recebemos uma solicitação para redefinir a senha da sua conta FlixView.</p><p><a href=\"" + link + "\" style=\"display:inline-block;padding:12px 20px;background:#e50914;color:#fff;text-decoration:none;border-radius:5px\">Redefinir senha</a></p><p>Este link expira em 30 minutos e pode ser usado uma única vez.</p><p>Se você não solicitou esta alteração, ignore este e-mail.</p></div>"
    });
}

module.exports = { enviarRecuperacao: enviarRecuperacao };
