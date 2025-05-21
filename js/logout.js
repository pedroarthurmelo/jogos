let proximaAcao = null; // Variável global temporária

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
window.onload = () => {
    fetch('../php/logout.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'deslogado') {
                mostrarAlerta("Você foi deslogado com sucesso!", () => {
                    window.location.href = "../html/login.html";
                });
            } else {
                mostrarAlerta("Erro ao deslogar.");
            }
        })
        .catch(error => {
            console.error("Erro na requisição de logout:", error);
            mostrarAlerta("Erro de conexão.");
        });
};

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
