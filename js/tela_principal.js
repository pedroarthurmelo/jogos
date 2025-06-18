// Efeito de scroll no menu
const nav = document.getElementById('nav'); //
if (nav) { // Adiciona verificação para evitar erro se 'nav' não existir
    window.addEventListener('scroll', () => { //
        if (window.scrollY >= 100) { //
            nav.classList.add('nav-black'); //
        } else { //
            nav.classList.remove('nav-black'); //
        }
    });
}

// Atualiza a exibição do menu conforme status do usuário
function atualizarMenuUsuario(statusLogin) { //
    const dropdown = document.querySelector('.dropdown'); //
    if (dropdown) { //
        if (statusLogin === 'logado') { //
            dropdown.style.display = 'block'; // Ou 'flex', 'grid', dependendo do seu CSS
        } else { //
            dropdown.style.display = 'none'; //
        }
    }
}

// Variável global para armazenar ação após alerta
let proximaAcao = null; //

// Mostra alerta com bloqueio de fundo
function mostrarAlerta(mensagem, aoConfirmar = null) { //
    const mensagemAlertaEl = document.getElementById("mensagemAlerta"); //
    const alertaPersonalizadoEl = document.getElementById("alertaPersonalizado"); //
    const fundoBloqueadorEl = document.getElementById("fundoBloqueador"); //

    // Garante que os elementos do alerta existem na página atual (tela_principal.html)
    if (mensagemAlertaEl && alertaPersonalizadoEl && fundoBloqueadorEl) { //
        mensagemAlertaEl.textContent = mensagem; //
        alertaPersonalizadoEl.style.display = "block"; //
        fundoBloqueadorEl.style.display = "block"; //
        document.body.style.overflow = "hidden"; // desativa o scroll
        proximaAcao = aoConfirmar; //
    } else {
        // Se a estrutura do alerta não estiver na tela_principal.html,
        // este console.warn ajudará a depurar.
        // Para a lógica de redirecionamento de sessão expirada, o alerta será na login.html.
        console.warn("Elementos do alerta personalizado não encontrados na página atual. Usando alert nativo se necessário."); //
        // Se esta função for chamada por outros motivos que não o redirecionamento, o alert nativo é um fallback.
        if (mensagem) { // Apenas mostra alert se houver mensagem
            alert(mensagem); //
             if (typeof aoConfirmar === "function") { //
                aoConfirmar(); //
            }
        }
    }
}

// Fecha o alerta e executa ação (se houver)
function fecharAlerta() { //
    const alertaPersonalizadoEl = document.getElementById("alertaPersonalizado"); //
    const fundoBloqueadorEl = document.getElementById("fundoBloqueador"); //

    if (alertaPersonalizadoEl && fundoBloqueadorEl) { //
        alertaPersonalizadoEl.style.display = "none"; //
        fundoBloqueadorEl.style.display = "none"; //
        document.body.style.overflow = "auto"; // reativa o scroll
    }
    if (typeof proximaAcao === "function") { //
        proximaAcao(); //
        proximaAcao = null; //
    }
}

// Verifica se a sessão do usuário ainda está ativa
function verificarSessao(isInitialCheck = false) { //
    fetch('../php/verificar_sessao.php', { cache: 'no-store' }) // Evitar cache
        .then(response => { //
            if (!response.ok) { //
                throw new Error('Falha na rede ou erro no servidor ao verificar sessão: ' + response.statusText); //
            }
            return response.json(); //
        })
        .then(data => { //
            if (data.status === 'expirado') { //
                // Redireciona diretamente com motivo
                const redirectURL = data.redirect_url || '../html/login.html?reason=session_expired'; //
                window.location.href = redirectURL; //
            } else if (data.status === 'logado') { //
                atualizarMenuUsuario('logado'); //
                if (isInitialCheck) { //
                    console.log('Usuário logado na tela principal. User ID:', data.user_id); //
                }
            } else if (data.status === 'nao_logado_redirect' || data.status === 'nao_logado') { //
                atualizarMenuUsuario('nao_logado'); //
                if (isInitialCheck) { //
                    console.log('Visitante não logado na tela principal.'); //
                }
            } else { //
                atualizarMenuUsuario('nao_logado'); //
                console.warn('Status de sessão inesperado:', data.status); //
            }
        })
        .catch(error => { //
            console.error('Erro ao verificar a sessão:', error); //
            atualizarMenuUsuario('nao_logado'); //
            if (isInitialCheck) { //
                console.error('Falha crítica na verificação inicial da sessão na tela principal.'); //
            }
        });
}

// Verificação inicial e periódica
verificarSessao(true); //
const INTERVALO_VERIFICACAO_SESSAO = 1000; // 10 segundos
setInterval(() => { //
    verificarSessao(false); //
}, INTERVALO_VERIFICACAO_SESSAO); //


// Previne teclas fora o Enter durante alerta (se houver alerta nesta página)
document.addEventListener("keydown", function(e) { //
    const alerta = document.getElementById("alertaPersonalizado"); //
    const aberto = alerta && window.getComputedStyle(alerta).display === "block"; //

    if (aberto && e.key !== "Enter") { //
        e.preventDefault(); //
        e.stopPropagation(); //
    }
}, true); //


// --- INÍCIO DA LÓGICA DE CRIPTOGRAFIA PARA CARREGAR JOGOS ---
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

        // Carregar jogos após o encryptor estar pronto
        carregarJogos(); // Chamada para carregar jogos

    } catch (error) {
        console.error("Erro ao carregar chave de segurança para jogos:", error);
        // Opcional: desabilitar a funcionalidade da página ou redirecionar
    }
});


// Carrega jogos dinamicamente nas seções
async function carregarJogos() { //
    if (!encryptor) {
        console.log("Aguardando chave de segurança para carregar jogos...");
        setTimeout(carregarJogos, 500); // Tenta novamente em 500ms
        return;
    }

    try {
        // 🔐 Gerar uma nova chave AES e IV para esta requisição
        const aesKey = CryptoJS.lib.WordArray.random(16); //
        const iv = CryptoJS.lib.WordArray.random(16);     //

        // Dados a serem criptografados (pode ser um objeto vazio, apenas um handshake)
        const requestData = JSON.stringify({});

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
            throw new Error('Erro na criptografia da chave para a requisição de jogos.');
        }

        const formData = new FormData();
        formData.append('encryptedData', encryptedRequestData);
        formData.append('encryptedKey', encryptedKey);

        const response = await fetch('../php/listar_jogos.php', { //
            method: 'POST', // Mudado para POST
            body: formData
        });

        if (!response.ok) { //
            throw new Error(`Erro HTTP ao buscar jogos! Status: ${response.status}`); //
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
            console.error("Resposta do servidor não criptografada ou em formato inesperado.", responseJson); //
            jogos = []; //
        }
        
        const containers = document.querySelectorAll('.row-posters'); //
        // Verifica se há containers suficientes.
        if (containers.length === 0) { //
            console.warn('Nenhum container ".row-posters" encontrado para carregar jogos.'); //
            return; //
        }
        
        // Limpa todos os containers encontrados antes de adicionar novos jogos
        containers.forEach(container => container.innerHTML = ''); //

        const lancamentosContainer = document.getElementById('lancamentos'); // Específico para lançamentos
        const popularContainer = containers[1]; // Assumindo ordem
        const vendidosContainer = containers[2]; // Assumindo ordem
        const melhorAvaliadosContainer = containers[3]; // Assumindo ordem


        jogos.forEach((jogo, index) => { //
            const criarImagem = () => { //
                const img = document.createElement('img'); //
                img.src = `../imagens_jogos/${jogo.imagem}`; // CONSTRUÇÃO DO CAMINHO DA IMAGEM
                img.alt = jogo.titulo || "Imagem do jogo"; //
                img.classList.add('row-poster'); //
                img.dataset.gameId = jogo.id; //
                
                img.addEventListener('click', () => { //
                    window.location.href = `pagina_jogo.html?id=${jogo.id}`; //
                });
                return img; //
            };

            // Distribuição dos jogos - Adapte conforme sua necessidade
            // Esta é uma forma simples de distribuir, talvez você queira
            // critérios específicos (data, popularidade, vendas, avaliação)
            // vindos do seu PHP para cada seção.
            if(lancamentosContainer) lancamentosContainer.appendChild(criarImagem()); //
            
            // Para os outros, você pode querer clonar ou criar novas imagens
            // se o mesmo jogo puder aparecer em múltiplas seções.
            if(popularContainer && index < 10) popularContainer.appendChild(criarImagem()); // Ex: 10 primeiros populares
            if(vendidosContainer && index < 10) vendidosContainer.appendChild(criarImagem()); // Ex: 10 primeiros vendidos
            
            if (melhorAvaliadosContainer && parseFloat(jogo.avaliacao) >= 8.0) { //
                melhorAvaliadosContainer.appendChild(criarImagem()); //
            }
        });

    } catch (error) { //
        console.error("Erro ao carregar jogos:", error); //
    }
}
// --- FIM DA LÓGICA DE CRIPTOGRAFIA PARA CARREGAR JOGOS ---