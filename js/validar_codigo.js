let proximaAcao = null;

function mostrarAlerta(mensagem, aoConfirmar = null) {
    document.getElementById("mensagemAlerta").textContent = mensagem;
    document.getElementById("alertaPersonalizado").style.display = "block";
    document.getElementById("fundoBloqueador").style.display = "block";
    document.body.style.overflow = "hidden"; // desativa o scroll
    proximaAcao = aoConfirmar;
}

function fecharAlerta() {
    document.getElementById("alertaPersonalizado").style.display = "none";
    document.getElementById("fundoBloqueador").style.display = "none";
    document.body.style.overflow = "auto"; // reativa o scroll
    if (typeof proximaAcao === "function") {
        proximaAcao();
        proximaAcao = null;
    }
}

function getEmailFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('email');
}

function validarCodigo() {
    const codigo = document.getElementById('codigo').value;
    const email = getEmailFromURL();

    if (!codigo) {
        mostrarAlerta("Por favor, preencha o código.");
        return;
    }

    let formData = new FormData();
    formData.append('codigo', codigo);
    formData.append('email', email);

    fetch('../php/validar_codigo.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            mostrarAlerta("Código verificado com sucesso!", () => {
                window.location.href = `../html/nova_senha.html?email=${encodeURIComponent(email)}`;
            });
        } else {
            mostrarAlerta("Erro: " + data.message);
        }
    })
    .catch(err => {
        console.error("Erro:", err);
        mostrarAlerta("Erro na solicitação. Tente novamente.");
    });
}

document.addEventListener("keydown", function(e) {
    const alerta = document.getElementById("alertaPersonalizado");
    const aberto = alerta && alerta.style.display === "block";

    if (aberto) {
        // Permitir apenas a tecla Enter (opcional)
        if (e.key !== "Enter") {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);
