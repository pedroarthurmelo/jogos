let proximaAcao = null;
let encryptor; // Declare encryptor globally

// Fetch public key on page load
document.addEventListener('DOMContentLoaded', () => {
    fetch('../php/get_public_key.php') // Adjust path if get_public_key.php is not in the same directory as this HTML
        .then(response => response.text())
        .then(publicKey => {
            encryptor = new JSEncrypt();
            encryptor.setPublicKey(publicKey);
        })
        .catch(error => {
            console.error("Error fetching public key:", error);
            mostrarAlerta('Erro ao carregar chave de segurança. Tente novamente.');
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

function getEmailFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('email');
}

async function atualizarSenha() { // Make function async
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const email = getEmailFromURL();

    if (!email) {
        mostrarAlerta("E-mail não encontrado na URL. Retorne e tente novamente.");
        return;
    }

    const regexSenha = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#!.])[0-9a-zA-Z$*&@#!.]{8,}$/;

    if (!regexSenha.test(senha)) {
        mostrarAlerta("A senha precisa ter no mínimo 8 caracteres, incluindo 1 número, 1 letra maiúscula e 1 símbolo.");
        return;
    }

    if (senha !== confirmarSenha) {
        mostrarAlerta("As senhas não coincidem.");
        return;
    }

    if (!encryptor) {
        mostrarAlerta('Chave de segurança não carregada. Aguarde ou recarregue a página.');
        return;
    }

    // Hash da nova senha (SHA256) antes da criptografia AES
    const hashSenha = CryptoJS.SHA256(senha).toString();

    // 🔐 Gerar chave AES e IV aleatórios
    const aesKey = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Preparar dados a serem criptografados (e-mail e senha hash)
    const passwordData = JSON.stringify({
        email: email,
        novaSenha: hashSenha
    });

    // 🔒 Criptografar os dados com AES
    const encryptedPasswordData = CryptoJS.AES.encrypt(passwordData, aesKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString();

    // 📦 Montar pacote da chave AES + IV
    const keyPackage = JSON.stringify({
        key: aesKey.toString(CryptoJS.enc.Hex),
        iv: iv.toString(CryptoJS.enc.Hex)
    });

    // 🔐 Criptografar chave + IV com RSA
    const encryptedKey = encryptor.encrypt(keyPackage);

    if (!encryptedKey) {
        mostrarAlerta('Erro na criptografia da chave. Tente novamente.');
        return;
    }

    let formData = new FormData();
    formData.append('encryptedPasswordData', encryptedPasswordData); // Envia e-mail e senha criptografados
    formData.append('encryptedKey', encryptedKey);                   // Envia a chave AES criptografada

    try {
        const res = await fetch('../php/atualizar_senha.php', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.status === 'success') {
            mostrarAlerta("Senha atualizada com sucesso!", () => {
                window.location.href = '../html/login.html';
            });
        } else {
            mostrarAlerta("Erro: " + data.message);
        }
    } catch (err) {
        console.error("Erro:", err);
        mostrarAlerta("Erro ao atualizar a senha.");
    }
}

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