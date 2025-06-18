let encryptor; // For encrypting data sent to server (using server's public key)

document.addEventListener("DOMContentLoaded", async () => { //
    try {
        // Fetch server's public key for encryption
        const publicKeyResponse = await fetch('../php/get_public_key.php');
        const publicKey = await publicKeyResponse.text();
        encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);

    } catch (error) {
        console.error("Erro ao carregar chave de segurança:", error);
        alert('Erro ao carregar chave de segurança para criptografia. Tente novamente.');
    }

    const params = new URLSearchParams(window.location.search); //
    const jogoID = params.get("id"); //

    if (!jogoID) { //
        alert("Jogo não especificado."); //
        return; //
    }

    try {
        // 🔐 Gerar uma nova chave AES e IV para esta requisição
        const aesKey = CryptoJS.lib.WordArray.random(16); //
        const iv = CryptoJS.lib.WordArray.random(16);     //

        // Dados a serem criptografados: o ID do jogo
        const requestData = JSON.stringify({ id: jogoID });

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
            throw new Error('Erro na criptografia da chave para a requisição.');
        }

        const formData = new FormData();
        formData.append('encryptedData', encryptedRequestData);
        formData.append('encryptedKey', encryptedKey);

        // Enviar a requisição como POST
        const response = await fetch(`../php/obter_jogo.php`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) { //
            throw new Error("Erro na resposta da requisição."); //
        }

        const responseJson = await response.json(); // Obter a resposta JSON bruta

        if (responseJson.error) {
            document.getElementById("titulo-jogo").textContent = responseJson.error;
            return;
        }

        let jogo;
        // O servidor agora retorna apenas 'encryptedJogoData'
        if (responseJson.encryptedJogoData) {
             // Descriptografar os dados da resposta usando a MESMA AES key e IV da requisição
             const decryptedJogoJson = CryptoJS.AES.decrypt(
                responseJson.encryptedJogoData,
                aesKey, // Use a mesma AES key que você gerou para a requisição
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
             ).toString(CryptoJS.enc.Utf8);
             jogo = JSON.parse(decryptedJogoJson);

        } else {
            // Fallback caso a resposta não esteja no formato esperado (não criptografada)
            console.error("Resposta do servidor não criptografada ou em formato inesperado.", responseJson);
            document.getElementById("titulo-jogo").textContent = "Erro ao carregar o jogo (formato inesperado).";
            return;
        }

        if (!jogo || jogo.erro) { //
            document.getElementById("titulo-jogo").textContent = jogo.erro || "Jogo não encontrado ou erro na descriptografia."; //
            return; //
        }

        // Preencher os campos com os dados
        document.getElementById("titulo-jogo").textContent = jogo.nome || "Sem título"; //
        document.getElementById("imagem-jogo").src = `../imagens_jogos/${jogo.imagem || 'default.jpg'}`; //
        document.getElementById("sinopse-jogo").textContent = jogo.sinopse || "Sem sinopse disponível."; //
        document.getElementById("criadora-jogo").textContent = jogo.criadora || "Desconhecida"; //
        document.getElementById("generos-jogo").textContent = jogo.generos || "N/A"; //
        document.getElementById("plataformas-jogo").textContent = jogo.plataformas || "N/A"; //
        document.getElementById("avaliacao-jogo").textContent = `⭐ (${jogo.avaliacao || 0}/10)`; //
        document.getElementById("lancamento-jogo").textContent = jogo.data_lancamento || "Data desconhecida"; //

        document.getElementById("requisitos-minimos").innerHTML = //
            (jogo.requisitos_minimos || "Não informado.").replace(/\n/g, "<br>"); //
        document.getElementById("requisitos-recomendados").innerHTML = //
            (jogo.requisitos_recomendados || "Não informado.").replace(/\n/g, "<br>"); //

    } catch (err) { //
        console.error("Erro ao buscar dados do jogo:", err); //
        document.getElementById("titulo-jogo").textContent = "Erro ao carregar o jogo."; //
    }
});