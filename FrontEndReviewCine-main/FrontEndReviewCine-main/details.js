// Arquivo completo: details.js

import { fetchData, getPosterUrl, BASE_API_URL } from './apiService.js';

async function carregarDetalhes() {
    const mainElement = document.getElementById('details-main');
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const type = urlParams.get('type'); // 'tv' ou 'movie'

    if (!id || !type) {
        mainElement.innerHTML = "<p>ID ou Tipo da obra não foi fornecido na URL.</p>";
        return;
    }

    const endpointPath = type === 'tv' ? 'series' : 'filmes';
    const elencoPath = type === 'tv' ? 'por-serie' : 'por-filme';
    const pageTitle = type === 'tv' ? 'Detalhes da Série' : 'Detalhes do Filme';
    document.title = pageTitle;

    const localApiUrl = `${BASE_API_URL}/${endpointPath}/${id}`;

    try {
        const obra = await fetchData(localApiUrl);
        const posterUrl = await getPosterUrl(type, obra.id);
        
        const titulo = obra.name || obra.title;
        const dataLancamento = obra.first_air_date || obra.release_date;
        const linguagem = obra.original_language || obra.language;

        const detailsHtml = `
            <div class="topo">
              <div class="col-esq">
                <div class="title">${titulo}</div>
                <div class="img-branca">
                  <div class="retrato">
                    ${posterUrl ? `<img src="${posterUrl}" alt="Pôster de ${titulo}" style="width:100%; height:100%;">` : 'Sem Imagem'}
                  </div>
                </div>
              </div>
              <div class="col-dir">
                <div class="title">Descrição</div>
                <div class="descricao">
                  ${obra.overview || 'Descrição não disponível.'}
                </div>
                <div class="info-adicional">
                    <div class="title">Informações Adicionais</div>
                    <div class="info-adicional-box">
                        <p><strong>Lançamento:</strong> ${dataLancamento || 'N/A'}</p>
                        <p><strong>Nota de Avaliação:</strong> ${Math.round(obra.vote_average * 10)} / 100</p>
                        <p><strong>Quantidade de Votos:</strong> ${obra.vote_count}</p>
                        <p><strong>Linguagem Original:</strong> ${linguagem ? linguagem.toUpperCase() : 'N/A'}</p>
                    </div>
                </div>
              </div>
            </div>
            <div class="elenco-section">
                <div class="title">Elenco Principal</div>
                <div id="elenco-container"><p>Buscando elenco...</p></div>
            </div>
        `;
        mainElement.innerHTML = detailsHtml;

        // Chama a função de carregar elenco, passando os parâmetros dinâmicos
        await carregarElenco(elencoPath, titulo);

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        mainElement.innerHTML = `<p>Erro ao carregar detalhes. Verifique se o ID e o Tipo são válidos e se a API está rodando.</p>`;
    }
}

/**
 * Cria e retorna a string HTML para um único card de pessoa do elenco.
 * @param {object} pessoa - O objeto da pessoa, vindo da API de elenco.
 * @param {string} profileUrl - A URL completa para a foto de perfil da pessoa.
 * @returns {string} - O HTML do card.
 */
function createActorCardHtml(pessoa, profileUrl) {
    // O card inteiro é um link para a página de detalhes da pessoa
    return `
        <a href="actorDetailsPage.html?id=${pessoa.id}" class="personagem-link">
            <div class="personagem-card">
                <div class="personagem-img">
                    ${profileUrl ? `<img src="${profileUrl}" alt="Foto de ${pessoa.name}">` : ''}
                </div>
                <div class="personagem-info">
                    <p><strong>Ator/Atriz:</strong> ${pessoa.name}</p>
                </div>
                <div class="personagem-extra-info">
                    <p><strong>Departamento:</strong> ${pessoa.department}</p>
                    <p><strong>Popularidade:</strong> ${pessoa.popularity.toFixed(2)}</p>
                </div>
            </div>
        </a>
    `;
}



async function carregarElenco(elencoPath, nomeDaObra) {
    const elencoContainer = document.getElementById('elenco-container');
    const tmdbApiKey = 'cd190993f189e0a225dc0799ddb4b9d1';
    
    const nomeCodificado = encodeURIComponent(nomeDaObra);
    const elencoApiUrl = `${BASE_API_URL}/elencos/${elencoPath}?nome=${nomeCodificado}`;

    try {
        const elencoData = await fetchData(elencoApiUrl, 'Elenco não encontrado para esta obra.');

        if (elencoData && elencoData.pessoas && elencoData.pessoas.length > 0) {
            const cardPromises = elencoData.pessoas.map(async (pessoa) => {
                const pessoaDetailUrl = `https://api.themoviedb.org/3/person/${pessoa.id}?api_key=${tmdbApiKey}&language=pt-BR`;
                let profileUrl = '';
                try {
                    const pessoaDetails = await fetchData(pessoaDetailUrl);
                    if (pessoaDetails.profile_path) {
                        profileUrl = `https://image.tmdb.org/t/p/w185${pessoaDetails.profile_path}`;
                    }
                } catch (e) {
                    console.warn(`Não foi possível buscar detalhes para a pessoa com ID ${pessoa.id}`);
                }

                // O HTML do card agora tem a classe 'clickable-image' e o data-id
                return `
                    <div class="personagem-card">
                        <div class="personagem-img clickable-image" data-id="${pessoa.id}">
                            ${profileUrl ? `<img src="${profileUrl}" alt="Foto de ${pessoa.name}">` : ''}
                        </div>
                        <div class="personagem-info">
                            <p><strong>Personagem:</strong> ${pessoa.character || 'Não informado'}</p>
                            <p><strong>Ator/Atriz:</strong> ${pessoa.name}</p>
                        </div>
                        <div class="personagem-extra-info">
                            <p><strong>Popularidade:</strong> ${pessoa.popularity.toFixed(2)}</p>
                            <p><strong>Departamento:</strong> ${pessoa.department}</p>
                            <p><strong>Gênero:</strong> ${pessoa.gender === 1 ? 'Feminino' : 'Masculino'}</p>
                        </div>
                    </div>
                `;
            });

            const cardsHtml = await Promise.all(cardPromises);
            elencoContainer.innerHTML = cardsHtml.join('');
            
            // --- CHAMADA DA NOVA FUNÇÃO ---
            // Depois que o HTML dos cards está na página, anexamos os eventos de clique.
            attachPersonClickEvents();

        } else {
            elencoContainer.innerHTML = '<p>Nenhuma informação de elenco encontrada.</p>';
        }
    } catch (error) {
        console.error('Erro ao buscar elenco:', error);
        elencoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

/**
 * Procura por todas as imagens de personagem clicáveis e adiciona o evento
 * que redireciona para a página de detalhes da pessoa.
 */
function attachPersonClickEvents() {
    const clickableImages = document.querySelectorAll('.clickable-image');
    
    clickableImages.forEach(imgDiv => {
        imgDiv.addEventListener('click', () => {
            // Pega o ID armazenado no atributo 'data-id'
            const pessoaId = imgDiv.dataset.id;
            if (pessoaId) {
                // Redireciona para a página de detalhes da pessoa
                window.location.href = `actorDetailsPage.html?id=${pessoaId}`;
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', carregarDetalhes);