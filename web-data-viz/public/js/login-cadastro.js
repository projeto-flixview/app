if (window.location.hash === "#cadastro") {
        exibirCadastrar();
    }

    async function autenticarUsuario() {
        const email = document.getElementById("login_email").value.trim();
        const senha = document.getElementById("login_senha").value;

        if (!email) {
            alert("Preencha o campo de e-mail.");
            return;
        }

        if (!senha) {
            alert("Preencha o campo de senha.");
            return;
        }

        if (!email.includes("@")) {
            alert("Digite um e-mail válido.");
            return;
        }

        try {
            const resposta = await fetch("/usuarios/autenticar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailServer: email,
                    senhaServer: senha
                })
            });
            const resultado = await resposta.json();
            if (!resposta.ok) {
                throw new Error(resultado.erro || "Email ou senha incorretos.");
            }

            sessionStorage.setItem("ID_USUARIO", resultado.idUsuario);
            sessionStorage.setItem("NOME_USUARIO", resultado.nome);
            sessionStorage.setItem("EMAIL_USUARIO", resultado.email);
            sessionStorage.setItem("ID_CARGO", resultado.idCargo);
            sessionStorage.setItem("CODIGO_ACESSO", resultado.idCargo);

            if (typeof guardarCodigoAcesso === "function") {
                guardarCodigoAcesso(resultado.idCargo);
            }

            if (resultado.idCargo === "USER0001") {
                window.location.href = "index.html";
            } else {
                window.location.href = "area-usuario.html";
            }
        } catch (erro) {
            alert(erro.message || "Não foi possível conectar ao servidor.");
        }
    }

    async function cadastrarUsuario(event) {
        event.preventDefault();
        const nome = document.getElementById("usuario_nome").value.trim();
        const email = document.getElementById("cadastro_email").value.trim();
        const senha = document.getElementById("cadastro_senha").value;
        const confirmacaoSenha = document.getElementById("usuario_senha_confirmacao").value;
        const codigo = document.getElementById("usuario_codigo").value;

        if (!email) {
            alert("Preencha o campo de e-mail.");
            return;
        }

        if (!email.includes("@")) {
            alert("Digite um e-mail válido.");
            return;
        }

        if (!senha) {
            alert("Preencha o campo de senha.");
            return;
        }

        if (senha.length < 5) {
            alert("A senha deve possuir no mínimo 5 caracteres.");
            return;
        }

        if (!/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/[0-9]/.test(senha) || !/[^A-Za-z0-9\s]/.test(senha)) {
            alert("A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.");
            return;
        }

        if (!confirmacaoSenha) {
            alert("Preencha o campo de confirmação de senha.");
            return;
        }

        if (senha !== confirmacaoSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        if (!nome) {
            alert("Preencha todos os campos.");
            return;
        }

        try {
            const resposta = await fetch("/usuarios/cadastrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nomeServer: nome,
                    emailServer: email,
                    senhaServer: senha,
                    codigoServer: codigo
                })
            });

            const resultado = await resposta.json();
            if (!resposta.ok) {
                throw new Error(resultado.erro || "Não foi possível realizar o cadastro.");
            }

            document.getElementById("form-cadastrar").reset();
            exibirEntrar();
        } catch (erro) {
            alert(erro.message || "Não foi possível conectar ao servidor.");
        }
    }