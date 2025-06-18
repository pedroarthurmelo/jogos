

// Fetch public key on page load (same as pagina_jogo.js, consider consolidating if possible)
document.addEventListener('DOMContentLoaded', async () => { //
    try {
        const publicKeyResponse = await fetch('../php/get_public_key.php');
        const publicKey = await publicKeyResponse.text();
        encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);
    } catch (error) {
        console.error("Erro ao carregar chave de segurança para comentários:", error);
        // Maybe show an alert or disable comment functionality
    }
    carregarComentarios(); // Call this after encryptor is initialized
});

function getJogoID() { //
    const params = new URLSearchParams(window.location.search); //
    return params.get("id"); //
}

document.querySelector('.botao-critica').addEventListener('click', async () => { //
    const critica = document.getElementById('criticaInput').value.trim(); //
    const jogo = getJogoID(); //

    if (!critica) { //
        alert("Digite sua crítica antes de enviar."); //
        return; //
    }

    if (!jogo) { //
        alert("ID do jogo não encontrado na URL."); //
        return; //
    }

    if (!encryptor) {
        alert('Chave de segurança não carregada. Aguarde ou recarregue a página.');
        return;
    }

    // 🔐 Gerar chave AES e IV aleatórios
    const aesKey = CryptoJS.lib.WordArray.random(16); //
    const iv = CryptoJS.lib.WordArray.random(16);     //

    // Preparar dados a serem criptografados (crítica e jogo ID)
    const commentData = JSON.stringify({
        critica: critica,
        jogo: jogo
    });

    // 🔒 Criptografar os dados com AES
    const encryptedCommentData = CryptoJS.AES.encrypt(commentData, aesKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC, //
        padding: CryptoJS.pad.Pkcs7 //
    }).toString();

    // 📦 Montar pacote da chave AES + IV
    const keyPackage = JSON.stringify({
        key: aesKey.toString(CryptoJS.enc.Hex),
        iv: iv.toString(CryptoJS.enc.Hex)
    });

    // 🔐 Criptografar chave + IV com RSA
    const encryptedKey = encryptor.encrypt(keyPackage);

    if (!encryptedKey) {
        alert('Erro na criptografia da chave. Tente novamente.');
        return;
    }

    const formData = new FormData();
    formData.append('encryptedData', encryptedCommentData);
    formData.append('encryptedKey', encryptedKey);

    try {
        const response = await fetch('../php/enviar_critica.php', { //
            method: 'POST', //
            body: formData //
        });

        const data = await response.json(); // Obter a resposta JSON bruta

        let decryptedData;
        if (data.encryptedResponse) {
             // Descriptografar os dados da resposta usando a MESMA AES key e IV da requisição
             const decryptedResponseJson = CryptoJS.AES.decrypt(
                data.encryptedResponse,
                aesKey, // Use a mesma AES key que você gerou para a requisição
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
             ).toString(CryptoJS.enc.Utf8);
             decryptedData = JSON.parse(decryptedResponseJson);

        } else if (data.status) { // Fallback para respostas não criptografadas (não deve ocorrer com implementação completa)
             decryptedData = data; //
        } else {
             throw new Error("Resposta inesperada do servidor (sem criptografia ou formato inválido).");
        }


        if (decryptedData.status === 'ok') { //
            document.getElementById('criticaInput').value = ''; //
            carregarComentarios(); // Atualiza lista de críticas
        } else {
            alert(decryptedData.mensagem); //
        }
    } catch (error) { //
        console.error("Erro ao enviar crítica:", error); //
        alert("Erro ao enviar crítica. Tente novamente.");
    }
});

async function carregarComentarios() { //
    const jogo = getJogoID(); //

    if (!jogo || !encryptor) return; //

    // 🔐 Gerar nova chave AES e IV para esta requisição
    const aesKey = CryptoJS.lib.WordArray.random(16); //
    const iv = CryptoJS.lib.WordArray.random(16);     //

    // Preparar dados a serem criptografados (apenas o jogo ID)
    const requestData = JSON.stringify({ jogo: jogo });

    // 🔒 Criptografar os dados com AES
    const encryptedRequestData = CryptoJS.AES.encrypt(requestData, aesKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC, //
        padding: CryptoJS.pad.Pkcs7 //
    }).toString();

    // 📦 Montar pacote da chave AES + IV
    const keyPackage = JSON.stringify({
        key: aesKey.toString(CryptoJS.enc.Hex),
        iv: iv.toString(CryptoJS.enc.Hex)
    });

    // 🔐 Criptografar chave + IV com RSA
    const encryptedKey = encryptor.encrypt(keyPackage);

    if (!encryptedKey) {
        console.error('Erro na criptografia da chave ao carregar comentários.');
        return;
    }

    const formData = new FormData();
    formData.append('encryptedData', encryptedRequestData);
    formData.append('encryptedKey', encryptedKey);

    try {
        const response = await fetch(`../php/obter_criticas.php`, { //
            method: 'POST', // Mudado para POST
            body: formData
        });

        const responseJson = await response.json(); // Obter a resposta JSON bruta

        let decryptedComments;
        if (responseJson.encryptedComments) {
            const decryptedCommentsJson = CryptoJS.AES.decrypt( //
                responseJson.encryptedComments, //
                aesKey, // Usar a MESMA AES key da requisição
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 } //
            ).toString(CryptoJS.enc.Utf8); //
            decryptedComments = JSON.parse(decryptedCommentsJson); //

        } else {
            // Fallback se a resposta não estiver criptografada (não deve acontecer com implementação completa)
            decryptedComments = responseJson; //
        }

        const comentariosDiv = document.getElementById('comentarios'); //
        comentariosDiv.innerHTML = ''; //
        if (!decryptedComments || decryptedComments.length === 0) { //
            comentariosDiv.innerHTML = '<p>Nenhuma crítica encontrada.</p>'; //
            return; //
        }
        decryptedComments.forEach(c => { //
            comentariosDiv.innerHTML += `
                <h3>${c.username}:</h3>
                <p>${c.texto}</p><br>
            `; //
        });
    } catch (error) { //
        console.error("Erro ao carregar críticas:", error); //
        document.getElementById('comentarios').innerHTML = '<p>Erro ao carregar críticas.</p>'; //
    }
}