// Importa as funções reutilizáveis do nosso módulo de serviço
import { fetchData, getPosterUrl, createCardHtml, BASE_API_URL } from './apiService.js';

/**
 * Função central para renderizar qualquer lista de FILMES na tela.
 * @param {Array} filmeList - A lista de objetos de filme a ser exibida.
 * @param {string} [notFoundMessage='Nenhum filme encontrado.'] - Mensagem para exibir se a lista estiver vazia.
 */
async function renderFilmes(filmeList, notFoundMessage = 'Nenhum filme encontrado para o critério informado.') {
    const mainContent = document.getElementById('main-content');
    
    if (!filmeList || filmeList.length === 0) {
        mainContent.innerHTML = `<p>${notFoundMessage}</p>`;
        return;
    }
    
    mainContent.innerHTML = ''; // Limpa o conteúdo para exibir os novos resultados

    // Processa a exibição em lotes para melhor performance
    const chunkSize = 5; 
    for (let i = 0; i < filmeList.length; i += chunkSize) {
        const chunk = filmeList.slice(i, i + chunkSize);
        
        const cardPromises = chunk.map(async (filme) => {
            // ADAPTAÇÃO: tipo 'movie' para buscar o pôster
            const posterUrl = await getPosterUrl('movie', filme.id);
            // ADAPTAÇÃO: página de detalhes de filme e tipo 'movie'
            return createCardHtml(filme, posterUrl, 'movie');
        });
        
        const cardsHtml = await Promise.all(cardPromises);
        mainContent.innerHTML += cardsHtml.join('');
    }
}

/**
 * Carrega os 3 filmes mais populares ao iniciar a página.
 */
async function carregarTopFilmes() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<p>Carregando filmes mais populares...</p>';
    try {
        // ADAPTAÇÃO: URL para o endpoint de filmes
        const topFilmes = await fetchData(`${BASE_API_URL}/filmes/obterTop5FilmesPopulares`);
        await renderFilmes(topFilmes);
    } catch (error) {
        mainContent.innerHTML = '<p>Não foi possível carregar os filmes populares.</p>';
    }
}

/**
 * Configura o botão de filtro por ID para filmes.
 */
function setupFiltroPorId() {
    const filtroBtn = document.getElementById('filtro-id-btn');
    filtroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = prompt("Digite o ID do FILME:");
        if (id && !isNaN(id)) {
            // ADAPTAÇÃO: Redireciona para a página genérica com o tipo 'movie'
            window.location.href = `details.html?id=${id}&type=movie`;
        }
    });
}

/**
 * Configura o botão de filtro por nome exato para filmes.
 */
async function setupFiltroPorNome() {
    const filtroBtn = document.getElementById('filtro-nome-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const nome = prompt("Digite o nome EXATO do FILME:");
        if (!nome || nome.trim() === '') return;
        try {
            // ADAPTAÇÃO: URL e parâmetro '?titulo=' para filmes
            const filme = await fetchData(`${BASE_API_URL}/filmes/obterPorNome?titulo=${encodeURIComponent(nome)}`);
            window.location.href = `details.html?id=${filme.id}&type=movie`;
        } catch (error) {
            alert(`Filme "${nome}" não encontrado.`);
        }
    });
}

/**
 * Configura o botão de filtro por palavra-chave para filmes.
 */
async function setupFiltroPorKeyword() {
    const filtroBtn = document.getElementById('filtro-keyword-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const keyword = prompt("Digite a palavra-chave para buscar filmes:");
        if (!keyword || keyword.trim() === '') return;
        document.getElementById('main-content').innerHTML = `<p>Buscando por "${keyword}"...</p>`;
        try {
            // ADAPTAÇÃO: URL para o endpoint de filmes
            const filmes = await fetchData(`${BASE_API_URL}/filmes/obterPorParte?nome=${encodeURIComponent(keyword)}`);
            await renderFilmes(filmes, `Nenhum filme encontrado com o termo "${keyword}".`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = `<p>Nenhum filme encontrado com o termo "${keyword}".</p>`;
        }
    });
}

/**
 * Configura o botão de filtro por popularidade para filmes.
 */
async function setupFiltroPorPopularidade() {
    const filtroBtn = document.getElementById('filtro-popularidade-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const popularidadeMinimaStr = prompt("Exibir filmes com popularidade MAIOR que (ex: 50):");
        if (!popularidadeMinimaStr || isNaN(popularidadeMinimaStr)) return;

        const popularidadeMinima = parseFloat(popularidadeMinimaStr);
        document.getElementById('main-content').innerHTML = `<p>Buscando filmes com popularidade > ${popularidadeMinima}...</p>`;

        try {
            const todosOsFilmes = await fetchData(`${BASE_API_URL}/filmes/obterPorPopularidade`);
            const filmesFiltrados = todosOsFilmes.filter(filme => filme.popularity > popularidadeMinima);
            await renderFilmes(filmesFiltrados, `Nenhum filme encontrado com popularidade maior que ${popularidadeMinima}.`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de filmes.</p>';
        }
    });
}

/**
 * Configura o botão de filtro por data de lançamento para filmes.
 */
async function setupFiltroPorLancamento() {
    const filtroBtn = document.getElementById('filtro-lancamento-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const dataLimiteStr = prompt("Exibir filmes lançados ATÉ a data (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        const regexData = /^\d{4}-\d{2}-\d{2}$/;
        if (!dataLimiteStr || !regexData.test(dataLimiteStr)) return;
        
        const dataLimite = new Date(dataLimiteStr);
        document.getElementById('main-content').innerHTML = `<p>Buscando filmes lançados até ${dataLimiteStr}...</p>`;

        try {
            const todosOsFilmes = await fetchData(`${BASE_API_URL}/filmes/obterPorPopularidade`);
            // ADAPTAÇÃO: campo de data para filmes é 'release_date'
            const filmesFiltrados = todosOsFilmes.filter(filme => filme.release_date && new Date(filme.release_date) <= dataLimite);
            await renderFilmes(filmesFiltrados, `Nenhum filme encontrado com data de lançamento até ${dataLimiteStr}.`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de filmes.</p>';
        }
    });
}

/**
 * Configura o filtro por linguagem para filmes.
 */
async function setupFiltroPorLinguagem() {
    const filtroBtn = document.getElementById('filtro-linguagem-btn');
    const modal = document.getElementById('language-modal');
    const closeBtn = document.querySelector('.close-btn');
    const languageListDiv = document.getElementById('language-list');
    if (!filtroBtn || !modal || !closeBtn) return;

    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
    
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        modal.style.display = 'block';
        languageListDiv.innerHTML = '<p>Carregando linguagens...</p>';
        try {
            const languages = await fetchData(`https://api.themoviedb.org/3/configuration/languages?api_key=cd190993f189e0a225dc0799ddb4b9d1`);
            languages.sort((a, b) => a.english_name.localeCompare(b.english_name));
            languageListDiv.innerHTML = '';

            languages.forEach(lang => {
                const langButton = document.createElement('button');
                langButton.className = 'language-item';
                langButton.textContent = `${lang.iso_639_1.toUpperCase()} - ${lang.english_name}`;
                langButton.onclick = () => {
                    modal.style.display = 'none';
                    buscarFilmesPorLinguagem(lang.iso_639_1);
                };
                languageListDiv.appendChild(langButton);
            });
        } catch (error) {
            languageListDiv.innerHTML = '<p>Não foi possível carregar as linguagens.</p>';
        }
    });

    async function buscarFilmesPorLinguagem(langCode) {
        document.getElementById('main-content').innerHTML = `<p>Buscando filmes no idioma '${langCode.toUpperCase()}'...</p>`;
        try {
            const todosOsFilmes = await fetchData(`${BASE_API_URL}/filmes/obterPorPopularidade`);
            // ADAPTAÇÃO: campo de idioma para filmes é 'language'
            const filmesFiltrados = todosOsFilmes.filter(filme => filme.language === langCode);
            await renderFilmes(filmesFiltrados, `Nenhum filme encontrado para o idioma '${langCode.toUpperCase()}'.`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de filmes.</p>';
        }
    }
}
/**
 * Configura o botão de filtro por avaliação para filmes.
 */
async function setupFiltroPorAvaliacao() {
    const filtroBtn = document.getElementById('filtro-avaliacao-btn');
    if (!filtroBtn) return;

    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const notaMinimaStr = prompt("Exibir filmes com avaliação MAIOR que (0 a 100):");

        if (!notaMinimaStr || isNaN(notaMinimaStr)) {
            if (notaMinimaStr !== null) {
                alert("Por favor, digite um valor numérico para a avaliação.");
            }
            return;
        }

        const notaMinimaUsuario = parseFloat(notaMinimaStr);
        // Converte a nota do usuário (0-100) para a escala da API (0-10)
        const notaMinimaApi = notaMinimaUsuario / 10;

        document.getElementById('main-content').innerHTML = `<p>Buscando filmes com avaliação > ${notaMinimaUsuario}/100...</p>`;

        try {
            // Usa o endpoint de filmes para obter a lista base
            const todosOsFilmes = await fetchData(`${BASE_API_URL}/filmes/obterPorPopularidade`);
            
            // Filtra a lista de filmes no lado do cliente
            const filmesFiltrados = todosOsFilmes.filter(filme => filme.vote_average > notaMinimaApi);
            
            // Reutiliza a função de renderização central para filmes
            await renderFilmes(filmesFiltrados, `Nenhum filme encontrado com avaliação maior que ${notaMinimaUsuario}/100.`);

        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de filmes.</p>';
        }
    });
}

// --- Ponto de Entrada Principal ---
// Adiciona todos os eventos de FILME quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarTopFilmes();
    setupFiltroPorId();
    setupFiltroPorNome();
    setupFiltroPorKeyword();
    setupFiltroPorPopularidade();
    setupFiltroPorLancamento();
    setupFiltroPorLinguagem();
    setupFiltroPorAvaliacao();
});