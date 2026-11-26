(function () {
    const formRecuperacao = document.getElementById("form-recuperacao");
    const btnSolicitar = document.getElementById("btn-solicitar");
    const formRedefinicao = document.getElementById("form-redefinicao");
    const areaReenvio = document.getElementById("area-reenvio");
    const btnReenviar = document.getElementById("btn-reenviar");
    const statusReenvio = document.getElementById("status-reenvio");
    const titulo = document.getElementById("titulo-pagina");
    const alerta = document.getElementById("alerta");
    const textoAlerta = document.getElementById("alerta-texto");
    const linkLogin = document.getElementById("link-login");
    const textoSolicitar = btnSolicitar.textContent;
    const textoReenviar = btnReenviar.textContent;
    const tokenRecuperacao = new URLSearchParams(window.location.search).get("token") || "";
    let emailSolicitado = "";
    let contadorCooldown;
    let fimCooldown = 0;
    let solicitacaoEmAndamento = false;

    function exibirAlerta(mensagem, mostrarLogin) {
        textoAlerta.textContent = mensagem;
        linkLogin.hidden = !mostrarLogin;
        alerta.hidden = false;
    }

    function fecharAlerta() {
        alerta.hidden = true;
    }

    function atualizarControles() {
        const segundos = Math.max(0, Math.ceil((fimCooldown - Date.now()) / 1000));
        const aguardando = segundos > 0;
        btnSolicitar.disabled = solicitacaoEmAndamento || aguardando;
        btnReenviar.disabled = solicitacaoEmAndamento || aguardando;
        btnSolicitar.textContent = textoSolicitar;
        btnReenviar.textContent = textoReenviar;
        statusReenvio.textContent = aguardando
            ? "Novo link disponível em " + segundos + "s."
            : solicitacaoEmAndamento ? "Enviando solicitação..." : "";
    }

    function iniciarCooldown() {
        fimCooldown = Date.now() + 60000;
        clearInterval(contadorCooldown);
        contadorCooldown = setInterval(function () {
            const segundos = Math.max(0, Math.ceil((fimCooldown - Date.now()) / 1000));
            if (segundos === 0) {
                clearInterval(contadorCooldown);
                atualizarControles();
                return;
            }
            
            atualizarControles();
        }, 1000);
        atualizarControles();
    }

    async function solicitarRecuperacao() {
        if (solicitacaoEmAndamento || Date.now() < fimCooldown) return;
        solicitacaoEmAndamento = true;
        areaReenvio.hidden = false;
        iniciarCooldown();
        atualizarControles();
        try {
            const resposta = await fetch("/usuarios/solicitar-recuperacao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailSolicitado })
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível processar a solicitação.");
            exibirAlerta("Verifique sua caixa de e-mail.", false);
        } catch (erro) {
            exibirAlerta(erro.message || "Não foi possível processar a solicitação.", false);
        } finally {
            solicitacaoEmAndamento = false;
            atualizarControles();
        }
    }

    document.getElementById("fechar-alerta").addEventListener("click", fecharAlerta);
    btnReenviar.addEventListener("click", function () {
        if (!btnReenviar.disabled) solicitarRecuperacao();
    });

    formRecuperacao.addEventListener("submit", function (evento) {
        evento.preventDefault();
        if (solicitacaoEmAndamento || Date.now() < fimCooldown) return;
        if (!formRecuperacao.reportValidity()) return;
        emailSolicitado = document.getElementById("recuperacao_email").value.trim();
        solicitarRecuperacao();
    });

    formRedefinicao.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        if (!formRedefinicao.reportValidity()) return;

        const senha = document.getElementById("nova_senha").value;
        const confirmacao = document.getElementById("confirmar_nova_senha").value;
        if (senha !== confirmacao) {
            document.getElementById("confirmar_nova_senha").setCustomValidity("As senhas não coincidem.");
            document.getElementById("confirmar_nova_senha").reportValidity();
            return;
        }
        document.getElementById("confirmar_nova_senha").setCustomValidity("");
        try {
            const resposta = await fetch("/usuarios/redefinir-senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: tokenRecuperacao, novaSenha: senha, confirmarSenha: confirmacao })
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível redefinir a senha.");
            exibirAlerta("Sua senha foi modificada com sucesso!", true);
        } catch (erro) {
            exibirAlerta(erro.message || "Não foi possível redefinir a senha.", false);
        }
    });

    document.getElementById("confirmar_nova_senha").addEventListener("input", function () {
        this.setCustomValidity("");
    });

    if (tokenRecuperacao) {
        formRecuperacao.hidden = true;
        areaReenvio.hidden = true;
        titulo.textContent = "Validando link de recuperação";
        fetch("/usuarios/validar-token-recuperacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tokenRecuperacao })
        }).then(async function (resposta) {
            const resultado = await resposta.json();
            if (!resposta.ok || !resultado.valido) throw new Error(resultado.erro || "Link inválido, expirado ou já utilizado. Solicite uma nova recuperação.");
            titulo.textContent = "Redefinir senha";
            formRedefinicao.hidden = false;
        }).catch(function (erro) {
            titulo.textContent = "Link de recuperação indisponível";
            exibirAlerta(erro.message || "Não foi possível validar o link agora.", true);
        });
    }
})();
