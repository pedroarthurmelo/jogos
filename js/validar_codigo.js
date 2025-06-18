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

async function validarCodigo() { // Make function async
    const codigo = document.getElementById('codigo').value;
    const email = getEmailFromURL(); // Email vem da URL, mas será criptografado aqui

    if (!codigo) {
        mostrarAlerta("Por favor, preencha o código.");
        return;
    }
    if (!email) {
        mostrarAlerta("E-mail não encontrado na URL. Retorne e tente novamente.");
        return;
    }

    if (!encryptor) {
        mostrarAlerta('Chave de segurança não carregada. Aguarde ou recarregue a página.');
        return;
    }

    // 🔐 Gerar chave AES e IV aleatórios
    const aesKey = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Preparar dados a serem criptografados (e-mail e código)
    const validationData = JSON.stringify({
        email: email,
        codigo: codigo
    });

    // 🔒 Criptografar os dados com AES
    const encryptedValidationData = CryptoJS.AES.encrypt(validationData, aesKey, {
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
    formData.append('encryptedValidationData', encryptedValidationData); // Envia dados criptografados
    formData.append('encryptedKey', encryptedKey);                         // Envia a chave AES criptografada

    try {
        const res = await fetch('../php/validar_codigo.php', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.status === "success") {
            mostrarAlerta("Código verificado com sucesso!", () => {
                window.location.href = `../html/nova_senha.html?email=${encodeURIComponent(email)}`;
            });
        } else {
            mostrarAlerta("Erro: " + data.message);
        }
    } catch (err) {
        console.error("Erro:", err);
        mostrarAlerta("Erro na solicitação. Tente novamente.");
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