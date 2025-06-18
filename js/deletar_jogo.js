let encryptor; // For encrypting data sent to server (using server's public key)

document.addEventListener('DOMContentLoaded', async () => { //
    try {
        // Fetch server's public key for encryption
        const publicKeyResponse = await fetch('../php/get_public_key.php');
        const publicKey = await publicKeyResponse.text();
        encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);

        // Load games after encryptor is ready
        carregarJogos(); //

    } catch (error) {
        console.error("Erro ao carregar chave de segurança:", error);
        alert('Erro ao carregar chave de segurança para criptografia. Tente novamente.');
        const select = document.getElementById('jogoSelect'); //
        select.innerHTML = '<option value="">Erro ao carregar jogos</option>'; //
    }
});

async function carregarJogos() { //
    const select = document.getElementById('jogoSelect'); //
    if (!encryptor) {
        select.innerHTML = '<option value="">Aguardando chave de segurança...</option>';
        return;
    }

    try {
        // 🔐 Gerar uma nova chave AES e IV para esta requisição
        const aesKey = CryptoJS.lib.WordArray.random(16); //
        const iv = CryptoJS.lib.WordArray.random(16);     //

        // Dados a serem criptografados (pode ser um objeto vazio ou um identificador de sessão se necessário)
        const requestData = JSON.stringify({}); // Enviando um payload vazio para listar

        // 🔒 Criptografar os dados da requisição com AES
        const encryptedRequestData = CryptoJS.AES.encrypt(requestData, aesKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC, //
            padding: CryptoJS.pad.Pkcs7 //
        }).toString();

        // 📦 Empacotar a chave AES e IV como JSON
        const keyPackage = JSON.stringify({
            key: aesKey.toString(CryptoJS.enc.Hex),
            iv: iv.toString(CryptoJS.enc.Hex)
        });

        // 🔐 Criptografar a chave AES + IV com RSA (usando a chave pública do servidor)
        const encryptedKey = encryptor.encrypt(keyPackage);

        if (!encryptedKey) {
            throw new Error('Erro na criptografia da chave para a requisição de listagem.');
        }

        const formData = new FormData();
        formData.append('encryptedData', encryptedRequestData);
        formData.append('encryptedKey', encryptedKey);

        const response = await fetch('../php/listar_jogos.php', { //
            method: 'POST', // Changed to POST
            body: formData
        });

        if (!response.ok) { //
            throw new Error('Erro na resposta da requisição de listagem.'); //
        }

        const responseJson = await response.json(); //

        let jogos;
        if (responseJson.encryptedJogosData) {
             // Descriptografar os dados da resposta usando a MESMA AES key e IV da requisição
             const decryptedJogosJson = CryptoJS.AES.decrypt(
                responseJson.encryptedJogosData,
                aesKey, // Use a mesma AES key que você gerou para a requisição
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
             ).toString(CryptoJS.enc.Utf8);
             jogos = JSON.parse(decryptedJogosJson);
        } else {
            console.error("Resposta do servidor não criptografada ou em formato inesperado.", responseJson);
            jogos = []; // Default to empty array on error
        }
        
        select.innerHTML = '<option value="">Selecione um jogo</option>'; //
        if (jogos.length > 0) { //
            jogos.forEach(jogo => { //
                const option = document.createElement('option'); //
                option.value = jogo.id; //
                option.textContent = jogo.nome; //
                select.appendChild(option); //
            });
        } else {
            select.innerHTML = '<option value="">Nenhum jogo encontrado</option>';
        }

    } catch (err) { //
        console.error('Erro ao carregar jogos:', err); //
        const select = document.getElementById('jogoSelect'); //
        select.innerHTML = '<option value="">Erro ao carregar jogos</option>'; //
    }
}

async function deletarJogo() { //
    const jogoId = document.getElementById('jogoSelect').value; //
    const msgDiv = document.getElementById("mensagem"); //

    if (!jogoId) { //
        msgDiv.textContent = 'Selecione um jogo.'; //
        return; //
    }

    const confirmacao = confirm("Tem certeza que deseja deletar este jogo?"); //
    if (!confirmacao) return; //

    if (!encryptor) {
        msgDiv.textContent = 'Chave de segurança não carregada. Aguarde ou recarregue a página.';
        return;
    }

    try {
        // 🔐 Gerar uma nova chave AES e IV para esta requisição
        const aesKey = CryptoJS.lib.WordArray.random(16); //
        const iv = CryptoJS.lib.WordArray.random(16);     //

        // Dados a serem criptografados: o ID do jogo a ser deletado
        const requestData = JSON.stringify({ id: jogoId });

        // 🔒 Criptografar os dados da requisição com AES
        const encryptedRequestData = CryptoJS.AES.encrypt(requestData, aesKey, {
            iv: iv,
            mode: CryptoJS.mode.CBC, //
            padding: CryptoJS.pad.Pkcs7 //
        }).toString();

        // 📦 Empacotar a chave AES e IV como JSON
        const keyPackage = JSON.stringify({
            key: aesKey.toString(CryptoJS.enc.Hex),
            iv: iv.toString(CryptoJS.enc.Hex)
        });

        // 🔐 Criptografar a chave AES + IV com RSA (usando a chave pública do servidor)
        const encryptedKey = encryptor.encrypt(keyPackage);

        if (!encryptedKey) {
            throw new Error('Erro na criptografia da chave para a requisição de deleção.');
        }

        const formData = new FormData();
        formData.append('encryptedData', encryptedRequestData);
        formData.append('encryptedKey', encryptedKey);

        const response = await fetch('../php/deletar_jogo.php', { //
            method: 'POST', //
            body: formData //
        });

        const responseJson = await response.json(); // Get the raw JSON response

        let resultado;
        if (responseJson.encryptedResponse) {
             // Descriptografar os dados da resposta usando a MESMA AES key e IV da requisição
             const decryptedResultJson = CryptoJS.AES.decrypt(
                responseJson.encryptedResponse,
                aesKey, // Use a mesma AES key que você gerou para a requisição
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
             ).toString(CryptoJS.enc.Utf8);
             resultado = JSON.parse(decryptedResultJson);
        } else {
            console.error("Resposta do servidor não criptografada ou em formato inesperado.", responseJson);
            resultado = { sucesso: false, mensagem: "Erro inesperado ao deletar." }; // Default error
        }

        if (resultado.sucesso) { //
            msgDiv.textContent = "Jogo deletado com sucesso!"; //
            carregarJogos(); // Atualiza a lista
        } else {
            msgDiv.textContent = resultado.mensagem || "Erro ao deletar jogo."; //
        }
    } catch (err) { //
        console.error('Erro na requisição:', err); //
        msgDiv.textContent = 'Erro na requisição.'; //
    }
}

