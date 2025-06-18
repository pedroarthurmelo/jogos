let proximaAcao = null; // Variável global temporária
let encryptor; // Declare encryptor globally

// Fetch public key on page load
document.addEventListener('DOMContentLoaded', () => {
    fetch('../php/get_public_key.php') // Assuming get_public_key.php is accessible at the root or adjust path
        .then(response => response.text())
        .then(publicKey => {
            encryptor = new JSEncrypt();
            encryptor.setPublicKey(publicKey);
        })
        .catch(error => {
            console.error("Error fetching public key:", error);
            mostrarAlerta("Erro ao carregar chave de segurança. Tente novamente.");
        });
});

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

async function login() { // Made function async
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;

    if (!email || !senha) {
        mostrarAlerta("Por favor, preencha todos os campos.");
        return;
    }

    if (!encryptor) {
        mostrarAlerta("Chave de segurança não carregada. Aguarde ou recarregue a página.");
        return;
    }

    // Generate random AES key and IV
    const aesKey = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Hash the password with SHA256
    const hashedPassword = CryptoJS.SHA256(senha).toString();

    // Prepare data to be encrypted (email and hashed password)
    const loginData = JSON.stringify({
        email: email,
        password: hashedPassword
    });

    // Encrypt the combined login data with AES
    const encryptedLoginData = CryptoJS.AES.encrypt(loginData, aesKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString();

    // Package AES key and IV as JSON
    const keyPackage = JSON.stringify({
        key: aesKey.toString(CryptoJS.enc.Hex),
        iv: iv.toString(CryptoJS.enc.Hex)
    });

    // Encrypt the AES key package with RSA
    const encryptedKey = encryptor.encrypt(keyPackage);

    if (!encryptedKey) {
        mostrarAlerta("Erro na criptografia da chave de sessão. Tente novamente.");
        return;
    }

    let formData = new FormData();
    formData.append("encryptedLoginData", encryptedLoginData); // Send encrypted email and password
    formData.append("encryptedKey", encryptedKey); // Send encrypted AES key + IV

    try {
        const response = await fetch("../php/login.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.status === "success") {
            mostrarAlerta(data.message, () => {
                window.location.href = "dashboard.html"; // Ajuste o caminho se necessário
            });
        } else if (data.status === "activate_2fa") {
            mostrarAlerta(data.message, () => {
                window.location.href = "../html/ativar_2fa.html";
            });
        } else if (data.status === "2fa_required") {
            mostrarAlerta(data.message, () => {
                window.location.href = "../html/verificar_2fa.html";
            });
        } else if (data.status === "not_verified") {
            mostrarAlerta("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
        } else {
            mostrarAlerta(data.message || "Erro no login. Tente novamente.");
        }
    } catch (error) {
        console.error("Erro:", error);
        mostrarAlerta("Erro no login. Tente novamente.");
    }
}

// Listener para o pressionamento de teclas quando o alerta estiver aberto
document.addEventListener("keydown", function(e) {
    const alerta = document.getElementById("alertaPersonalizado");
    const aberto = alerta && alerta.style.display === "block";

    if (aberto) {
        if (e.key !== "Enter") {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);


// Script para verificar motivo de redirecionamento na URL ao carregar a página de login
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason');
    let alertMessage = null;

    if (reason === 'session_expired') {
        alertMessage = 'Tempo de sessão expirado! Faça login novamente.';
    } else if (reason === 'not_logged_in') {
        alertMessage = 'Você precisa fazer login primeiro para acessar esta página.';
    } else if (reason === 'session_check_failed') {
        alertMessage = 'Falha ao verificar sua sessão. Por favor, tente fazer login.';
    } else if (reason === 'fallback_redirect' || reason === 'unknown_status') {
        alertMessage = 'Ocorreu um redirecionamento inesperado. Por favor, faça login.';
    }

    if (alertMessage) {
        mostrarAlerta(alertMessage);
        if (window.history.replaceState) {
            const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanURL }, '', cleanURL);
        }
    }
});