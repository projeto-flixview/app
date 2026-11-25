function validarSessao() {
    var id = sessionStorage.getItem("ID_USUARIO");
    var email = sessionStorage.getItem("EMAIL_USUARIO");

    if (email == null || id == null) {
        return false;
    } else {
        return true;
    }
}

function guardarCodigoAcesso(codigo) {
    if (codigo) {
        sessionStorage.setItem("CODIGO_ACESSO", codigo);
        sessionStorage.setItem("ID_CARGO", codigo);
    }
}

function obterCodigoAcesso() {
    return sessionStorage.getItem("CODIGO_ACESSO") || sessionStorage.getItem("ID_CARGO");
}

function validarAcessoAreaUsuario() {
    // 1. Usa a função que já existe no projeto para validar se está logado
    if (!validarSessao()) {
        alert("Acesso restrito. Você precisa estar logado para acessar esta área.");
        window.location.href = "login-cadastro.html";
        return false;
    }

    // 2. Valida se o usuário possui cargo/código com permissão
    var codigo = obterCodigoAcesso();
    if (codigo === "USER0001" || !codigo) {
        alert("Acesso negado: seu usuário (código " + (codigo || "não identificado") + ") não possui permissão para acessar esta área.");
        window.location.href = "index.html";
        return false;
    }

    // 3. Validação adicional no back-end para conferir no banco de dados
    validarAcessoBackEnd();

    return true;
}

async function validarAcessoBackEnd() {
    var idUsuario = sessionStorage.getItem("ID_USUARIO");
    var idCargo = obterCodigoAcesso();

    try {
        var resposta = await fetch("/usuarios/validar-acesso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idUsuarioServer: idUsuario,
                idCargoServer: idCargo
            })
        });

        if (!resposta.ok) {
            var dados = await resposta.json().catch(function () { return {}; });
            alert(dados.mensagem || "Acesso negado pelo servidor.");
            window.location.href = "index.html";
            return false;
        }

        return true;
    } catch (erro) {
        console.warn("Validação local ativa. Erro ao consultar validação no servidor:", erro);
        return true;
    }
}

// Aliases para facilitar o uso nas páginas
var validarAcesso = validarAcessoAreaUsuario;
var validarSessaoAreaUsuario = validarAcessoAreaUsuario;

function limparSessao() {
    sessionStorage.clear();
    window.location.reload();
}
