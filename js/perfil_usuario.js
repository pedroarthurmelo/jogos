let encryptor; // Declarado no escopo global para ser acessível por ambas as funções.

// Este listener é um bloco async/await com try/catch.
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch server's public key for encryption
        const publicKeyResponse = await fetch('../php/get_public_key.php');
        if (!publicKeyResponse.ok) { // Verifica se a requisição foi bem-sucedida
            throw new Error(`Erro HTTP ao buscar chave pública: ${publicKeyResponse.status}`);
        }
        const publicKey = await publicKeyResponse.text();
        encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);

        // Carregar dados do usuário após o encryptor estar pronto
        carregarDadosUsuario();

    } catch (error) {
        console.error("Erro ao carregar chave de segurança:", error);
        alert('Erro ao carregar chave de segurança para criptografia. Tente novamente.');
        // Opcional: desabilitar a funcionalidade da página ou redirecionar
    }
});

// Esta função é async e possui seu próprio bloco try/catch.
async function carregarDadosUsuario() {
    // Verifica se o encryptor foi inicializado. Se não, tenta novamente após um pequeno atraso.
    if (!encryptor) {
        console.log("Aguardando chave de segurança para carregar dados do usuário...");
        setTimeout(carregarDadosUsuario, 500); // Tenta novamente em 500ms
        return;
    }

    try {
        // 🔐 Gerar uma nova chave AES e IV para esta requisição
        const aesKey = CryptoJS.lib.WordArray.random(16);
        const iv = CryptoJS.lib.WordArray.random(16);

        // Dados a serem criptografados (pode ser um objeto vazio, pois o user_id vem da sessão no PHP)
        const requestData = JSON.stringify({});

        // 🔒 Criptografar os dados da requisição com AES
        const encryptedRequestData = CryptoJS.AES.encrypt(requestData, aesKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        // 📦 Empacotar a chave AES e IV como JSON
        const keyPackage = JSON.stringify({
            key: aesKey.toString(CryptoJS.enc.Hex),
            iv: iv.toString(CryptoJS.enc.Hex)
        });

        // 🔐 Criptografar a chave AES + IV com RSA (usando a chave pública do servidor)
        const encryptedKey = encryptor.encrypt(keyPackage);

        if (!encryptedKey) {
            throw new Error('Erro na criptografia da chave para a requisição de perfil.');
        }

        const formData = new FormData();
        formData.append('encryptedData', encryptedRequestData);
        formData.append('encryptedKey', encryptedKey);

        const response = await fetch('../php/perfil_usuario.php', {
            method: 'POST',
            body: formData
        });

        const responseJson = await response.json();

        let decryptedData;
        if (responseJson.encryptedUserData) { // Verifica se a resposta está no formato criptografado
             // Descriptografar os dados da resposta usando a MESMA AES key e IV da requisição
             const decryptedUserJson = CryptoJS.AES.decrypt(
                responseJson.encryptedUserData,
                aesKey, // Use a mesma AES key que você gerou para a requisição
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
             ).toString(CryptoJS.enc.Utf8);
             decryptedData = JSON.parse(decryptedUserJson);

        } else {
            // Este bloco será executado se o servidor retornar um erro não criptografado (e.g., sessão inválida)
            console.error("Resposta do servidor não criptografada ou em formato inesperado.", responseJson);
            decryptedData = { status: 'erro', mensagem: 'Resposta inesperada do servidor ou sessão inválida.' };
        }
        
        console.log('Dados do usuário (descriptografados):', decryptedData);
        if (decryptedData.status === 'ok') {
            // Verifica se os elementos existem antes de alterar o texto
            const nomeElem = document.getElementById('nomeUsuario');
            const emailElem = document.getElementById('emailUsuario');
            const dataRegistroElem = document.getElementById('dataRegistro');

            if (nomeElem) nomeElem.textContent = decryptedData.usuario.username || 'Nome não disponível';
            if (emailElem) emailElem.textContent = decryptedData.usuario.email || 'Email não disponível';
            if (dataRegistroElem) dataRegistroElem.textContent = decryptedData.usuario.data_registro || 'Data não disponível';
        } else {
            console.error('Erro:', decryptedData.mensagem);
            alert('Erro ao carregar dados do usuário: ' + decryptedData.mensagem);
            // Aqui você pode redirecionar para a página de login, se quiser
            // window.location.href = '../html/login.html';
        }
    } catch (error) { // Catch para erros na requisição ou descriptografia
        console.error('Erro ao carregar perfil:', error);
        alert('Erro na comunicação com o servidor: ' + error.message);
    }
}