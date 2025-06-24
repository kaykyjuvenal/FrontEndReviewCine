const TMDB_API_KEY = 'cd190993f189e0a225dc0799ddb4b9d1';
const BASE_API_URL = 'http://localhost:8080'; // A base da sua API local

/**
 * Função genérica para fazer requisições fetch e tratar erros comuns.
 * @param {string} url - A URL para a qual fazer a requisição.
 * @returns {Promise<any>} - O resultado da requisição em formato JSON.
 */
async function fetchData(url, errorMessage = 'Falha ao buscar dados.') {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`${errorMessage} Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro na requisição para ${url}:`, error);
        throw error; // Re-lança o erro para que a função que chamou possa tratá-lo
    }
}

/**
 * Busca os detalhes de uma obra (filme ou série) no TMDB para obter o pôster.
 * @param {string} type - 'tv' para séries, 'movie' para filmes.
 * @param {number} id - O ID da obra no TMDB.
 * @returns {Promise<string>} - A URL completa do pôster.
 */
async function getPosterUrl(type, id) {
    const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    try {
        const details = await fetchData(url, 'Falha ao buscar detalhes no TMDB.');
        return details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
    } catch (error) {
        return ''; // Retorna vazio se falhar, para não quebrar a renderização
    }
}

/**
 * Monta o HTML de um card para uma obra (filme ou série).
 * @param {object} obra - O objeto da obra (deve ter id, title/name, vote_average).
 * @param {string} posterUrl - A URL do pôster.
 * @param {string} type - O tipo de obra ('movie' ou 'tv').
 * @returns {string} - A string HTML do card.
 */
function createCardHtml(obra, posterUrl, type) {
    const title = obra.title || obra.name; // Pega 'title' para filmes ou 'name' para séries
    const pageName = 'details.html'; // Agora sempre aponta para a página genérica

    // O link agora inclui o 'id' E o 'type'
    return `
        <a href="${pageName}?id=${obra.id}&type=${type}" class="poster-link">
            <div class="card">
                <div class="title">${title}</div>
                <div class="poster">
                    ${posterUrl ? `<img src="${posterUrl}" alt="Pôster de ${title}" style="width:100%; height:100%; border-radius: 4px;">` : 'Sem Imagem'}
                </div>
                <div class="rating">${Math.round(obra.vote_average * 10)}</div>
            </div>
        </a>
    `;
}
/**
 * Cria e retorna a string HTML para um único card de pessoa.
 * Apenas a imagem é um link clicável para a página de detalhes.
 * @param {object} pessoa - O objeto da pessoa.
 * @param {string} profileUrl - A URL completa para a foto de perfil da pessoa.
 * @returns {string} - O HTML do card.
 */
function createActorCardHtml(pessoa, profileUrl) {
    // O card agora é o container principal, e o link <a> envolve apenas a imagem.
    return `
        <div class="personagem-card">
            <a href="actorDetailsPage.html?id=${pessoa.id}" class="personagem-img-link">
                <div class="personagem-img">
                    ${profileUrl ? `<img src="${profileUrl}" alt="Foto de ${pessoa.name}">` : 'Sem Foto'}
                </div>
            </a>
            <div class="personagem-info">
                <p><strong>Ator/Atriz:</strong> ${pessoa.name}</p>
                <p><strong>Personagem:</strong> ${pessoa.character || 'Não informado'}</p>
            </div>
            <div class="personagem-extra-info">
                <p><strong>Departamento:</strong> ${pessoa.department}</p>
                <p><strong>Popularidade:</strong> ${pessoa.popularity.toFixed(2)}</p>
                <p><strong>Gênero:</strong> ${pessoa.gender === 1 ? 'Feminino' : 'Masculino'}</p>
            </div>
        </div>
    `;
}
export { fetchData, getPosterUrl, createCardHtml, createActorCardHtml, BASE_API_URL };

