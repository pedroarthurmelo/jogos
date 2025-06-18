document.addEventListener('DOMContentLoaded', () => {
    let encryptor;

    // Fetch public key on page load
    fetch('../php/get_public_key.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao carregar a chave pública.');
            }
            return response.text();
        })
        .then(publicKey => {
            encryptor = new JSEncrypt();
            encryptor.setPublicKey(publicKey);
        })
        .catch(error => {
            console.error(error);
            document.getElementById("mensagem").textContent = 'Erro crítico: Não foi possível carregar a chave de segurança. Tente recarregar a página.';
            document.getElementById("mensagem").style.color = "red";
        });

    document.getElementById("formJogo").addEventListener("submit", async function (e) {
        e.preventDefault();

        const form = this;
        const mensagemEl = document.getElementById("mensagem");
        const formData = new FormData(form);

        if (!encryptor) {
            mensagemEl.textContent = 'A chave de segurança ainda não foi carregada. Por favor, aguarde um momento e tente novamente.';
            mensagemEl.style.color = "red";
            return;
        }

        // Disable button to prevent multiple submissions
        const botao = form.querySelector("button[type='submit']");
        botao.disabled = true;
        mensagemEl.textContent = "Enviando...";
        mensagemEl.style.color = "black"; // Reset color

        // Extract game data from formData for encryption
        const gameData = {};
        for (const [key, value] of formData.entries()) {
            // Exclude the 'imagem' file from JSON serialization for encryption
            if (key !== 'imagem') {
                gameData[key] = value;
            }
        }

        try {
            // Generate random AES key and IV
            const chaveAES = CryptoJS.lib.WordArray.random(16); // 128 bits
            const iv = CryptoJS.lib.WordArray.random(16);

            // Encrypt game data (JSON format) with AES
            const dadosJson = JSON.stringify(gameData);
            const dadosCriptografados = CryptoJS.AES.encrypt(dadosJson, chaveAES, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }).toString();

            // Encrypt AES key and IV with RSA
            const pacoteChave = JSON.stringify({
                chave: chaveAES.toString(CryptoJS.enc.Hex),
                iv: iv.toString(CryptoJS.enc.Hex)
            });
            const chaveCriptografada = encryptor.encrypt(pacoteChave);

            if (!chaveCriptografada) {
                throw new Error('Erro na criptografia da chave de segurança. Não foi possível enviar os dados.');
            }

            // Create a new FormData object to send encrypted data and the image file
            const encryptedFormData = new FormData();
            encryptedFormData.append('dados', dadosCriptografados);
            encryptedFormData.append('chave', chaveCriptografada);
            // Append the image file separately, as it's not part of the AES encryption
            if (formData.has('imagem')) {
                encryptedFormData.append('imagem', formData.get('imagem'));
            }

            const response = await fetch("../php/adicionar_jogo.php", {
                method: "POST",
                body: encryptedFormData,
            });

            const resultado = await response.json();

            mensagemEl.textContent = resultado.mensagem;
            mensagemEl.style.color = resultado.sucesso ? "green" : "red";

            if (resultado.sucesso) {
                form.reset();
            }

        } catch (error) {
            mensagemEl.textContent = "Erro na requisição: " + error.message;
            mensagemEl.style.color = "red";
            console.error(error);
        } finally {
            botao.disabled = false;
        }
    });
});