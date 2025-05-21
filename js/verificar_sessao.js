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

function verificarSessao() {
    fetch('../php/verificar_sessao.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'expirado') {
                mostrarAlerta('Tempo de sessão expirado! Faça login novamente.', () => {
                    window.location.href = '../html/login.html';
                });
            } else if (data.status === 'logado') {
                console.log('Usuário logado:', data.user_id);
            } else if (data.status === 'nao_logado') {
                mostrarAlerta('Você precisa estar logado para acessar esta página.', () => {
                    window.location.href = '../html/bem_vindo.html';
                });
            }
        })
        .catch(error => {
            console.error('Erro ao verificar a sessão:', error);
        });
}


// Verifica a sessão a cada 5 segundos
setInterval(verificarSessao, 5000);

// Verifica imediatamente ao carregar
verificarSessao();


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
