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
            document.getElementById('mensagem').textContent = 'Erro ao carregar chave de segurança. Tente novamente.';
        });
});

document.getElementById('verificarForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!encryptor) {
        document.getElementById('mensagem').textContent = 'Chave de segurança não carregada. Aguarde ou recarregue a página.';
        return;
    }

    const codigo = this.codigo.value;

    if (!codigo) {
        document.getElementById('mensagem').textContent = 'Por favor, digite o código.';
        return;
    }

    // Generate random AES key and IV
    const aesKey = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Prepare data to be encrypted (the 2FA code)
    const codeData = JSON.stringify({
        code: codigo
    });

    // Encrypt the code data with AES
    const encryptedCode = CryptoJS.AES.encrypt(codeData, aesKey, {
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
        document.getElementById('mensagem').textContent = 'Erro na criptografia da chave de sessão. Tente novamente.';
        return;
    }

    // Prepare data for the server (encrypted code and encrypted AES key)
    const formData = new FormData();
    formData.append("encryptedCode", encryptedCode);
    formData.append("encryptedKey", encryptedKey);

    // Atualiza a mensagem para o usuário enquanto aguarda a resposta do servidor.
    document.getElementById('mensagem').textContent = 'Verificando código...';

    try {
        const res = await fetch('../php/verificar_2fa.php', {
            method: 'POST',
            body: formData // Use FormData for multipart/form-data
        });

        const data = await res.json();

        if (data.success) {
            document.getElementById('mensagem').textContent = 'Verificação bem-sucedida! Redirecionando...'; // Mensagem de sucesso
            // Adicionar um atraso de 5 segundos (5000 milissegundos) ANTES do redirecionamento
            setTimeout(() => {
                window.location.href = '../html/tela_principal.html';
            }, 5000); // 5000 milissegundos = 5 segundos
        } else {
            document.getElementById('mensagem').textContent = data.error || 'Erro ao verificar o código.';
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        document.getElementById('mensagem').textContent = 'Erro na requisição.';
    }
});