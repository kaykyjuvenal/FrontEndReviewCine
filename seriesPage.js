// Importa as funções reutilizáveis do nosso módulo de serviço
import { fetchData, getPosterUrl, createCardHtml, BASE_API_URL } from './apiService.js';

/**
 * Função central para renderizar qualquer lista de séries na tela.
 * Ela cuida de buscar os pôsteres e montar os cards em lotes.
 * @param {Array} seriesList - A lista de objetos de série a ser exibida.
 * @param {string} [notFoundMessage='Nenhuma série encontrada.'] - Mensagem para exibir se a lista estiver vazia.
 */
async function renderSeries(seriesList, notFoundMessage = 'Nenhuma série encontrada para o critério informado.') {
    const mainContent = document.getElementById('main-content');
    
    if (!seriesList || seriesList.length === 0) {
        mainContent.innerHTML = `<p>${notFoundMessage}</p>`;
        return;
    }
    
    mainContent.innerHTML = ''; // Limpa o conteúdo para exibir os novos resultados

    // Processa a exibição em lotes para melhor performance
    const chunkSize = 5; 
    for (let i = 0; i < seriesList.length; i += chunkSize) {
        const chunk = seriesList.slice(i, i + chunkSize);
        
    const cardPromises = chunk.map(async (serie) => {
       const posterUrl = await getPosterUrl('tv', serie.id);
    return createCardHtml(serie, posterUrl, 'tv');
});
        
        const cardsHtml = await Promise.all(cardPromises);
        mainContent.innerHTML += cardsHtml.join('');
    }
}

/**
 * Carrega as 3 séries mais populares ao iniciar a página.
 */
async function carregarTopSeries() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<p>Carregando séries mais populares...</p>';
    try {
        const topSeries = await fetchData(`${BASE_API_URL}/series/obterTop5SeriesPopulares`);
        await renderSeries(topSeries);
    } catch (error) {
        mainContent.innerHTML = '<p>Não foi possível carregar as séries populares.</p>';
    }
}

/**
 * Configura o botão de filtro por ID.
 */
function setupFiltroPorId() {
    const filtroBtn = document.getElementById('filtro-id-btn');
    filtroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = prompt("Digite o ID da série:");
        if (id && !isNaN(id)) {
            window.location.href = `serieDetailsPage.html?id=${id}`;
        }
    });
}

/**
 * Configura o botão de filtro por nome exato.
 */
async function setupFiltroPorNome() {
    const filtroBtn = document.getElementById('filtro-nome-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const nome = prompt("Digite o nome EXATO da série:");
        if (!nome || nome.trim() === '') return;
        try {
            const serie = await fetchData(`${BASE_API_URL}/series/obterPorNome?nome=${encodeURIComponent(nome)}`);
            window.location.href = `serieDetailsPage.html?id=${serie.id}`;
        } catch (error) {
            alert(`Série "${nome}" não encontrada.`);
        }
    });
}

/**
 * Configura o botão de filtro por palavra-chave.
 */
async function setupFiltroPorKeyword() {
    const filtroBtn = document.getElementById('filtro-keyword-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const keyword = prompt("Digite a palavra-chave para buscar séries:");
        if (!keyword || keyword.trim() === '') return;
        document.getElementById('main-content').innerHTML = `<p>Buscando por "${keyword}"...</p>`;
        try {
            const series = await fetchData(`${BASE_API_URL}/series/obterPorParte?keyword=${encodeURIComponent(keyword)}`);
            await renderSeries(series, `Nenhuma série encontrada com o termo "${keyword}".`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = `<p>Nenhuma série encontrada com o termo "${keyword}".</p>`;
        }
    });
}

/**
 * Configura o botão de filtro por popularidade.
 */
async function setupFiltroPorPopularidade() {
    const filtroBtn = document.getElementById('filtro-popularidade-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const popularidadeMinimaStr = prompt("Exibir séries com popularidade MAIOR que (ex: 50):");
        if (!popularidadeMinimaStr || isNaN(popularidadeMinimaStr)) return;

        const popularidadeMinima = parseFloat(popularidadeMinimaStr);
        document.getElementById('main-content').innerHTML = `<p>Buscando séries com popularidade > ${popularidadeMinima}...</p>`;

        try {
            const todasAsSeries = await fetchData(`${BASE_API_URL}/series/obterPorPopularidade`);
            const seriesFiltradas = todasAsSeries.filter(serie => serie.popularity > popularidadeMinima);
            await renderSeries(seriesFiltradas, `Nenhuma série encontrada com popularidade maior que ${popularidadeMinima}.`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de séries.</p>';
        }
    });
}

/**
 * Configura o botão de filtro por data de lançamento.
 */
async function setupFiltroPorLancamento() {
    const filtroBtn = document.getElementById('filtro-lancamento-btn');
    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const dataLimiteStr = prompt("Exibir séries lançadas ATÉ a data (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        const regexData = /^\d{4}-\d{2}-\d{2}$/;
        if (!dataLimiteStr || !regexData.test(dataLimiteStr)) return;
        
        const dataLimite = new Date(dataLimiteStr);
        document.getElementById('main-content').innerHTML = `<p>Buscando séries lançadas até ${dataLimiteStr}...</p>`;

        try {
            const todasAsSeries = await fetchData(`${BASE_API_URL}/series/obterPorPopularidade`);
            const seriesFiltradas = todasAsSeries.filter(serie => serie.first_air_date && new Date(serie.first_air_date) <= dataLimite);
            await renderSeries(seriesFiltradas, `Nenhuma série encontrada com data de lançamento até ${dataLimiteStr}.`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de séries.</p>';
        }
    });
}

// O filtro de linguagem já estava bem modular, então a mudança é menor.
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
                    buscarSeriesPorLinguagem(lang.iso_639_1);
                };
                languageListDiv.appendChild(langButton);
            });
        } catch (error) {
            languageListDiv.innerHTML = '<p>Não foi possível carregar as linguagens.</p>';
        }
    });

    async function buscarSeriesPorLinguagem(langCode) {
        document.getElementById('main-content').innerHTML = `<p>Buscando séries no idioma '${langCode.toUpperCase()}'...</p>`;
        try {
            const todasAsSeries = await fetchData(`${BASE_API_URL}/series/obterPorPopularidade`);
            const seriesFiltradas = todasAsSeries.filter(serie => serie.original_language === langCode);
            await renderSeries(seriesFiltradas, `Nenhuma série encontrada para o idioma '${langCode.toUpperCase()}'.`);
        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de séries.</p>';
        }
    }
}
async function setupFiltroPorAvaliacao() {
    const filtroBtn = document.getElementById('filtro-avaliacao-btn');
    if (!filtroBtn) return;

    filtroBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const notaMinimaStr = prompt("Exibir séries com avaliação MAIOR que (0 a 100):");

        if (!notaMinimaStr || isNaN(notaMinimaStr)) {
            if (notaMinimaStr !== null) {
                alert("Por favor, digite um valor numérico para a avaliação.");
            }
            return;
        }

        const notaMinimaUsuario = parseFloat(notaMinimaStr);
        // Converte a nota do usuário (0-100) para a escala da API (0-10) para a comparação
        const notaMinimaApi = notaMinimaUsuario / 10;

        document.getElementById('main-content').innerHTML = `<p>Buscando séries com avaliação > ${notaMinimaUsuario}/100...</p>`;

        try {
            const todasAsSeries = await fetchData(`${BASE_API_URL}/series/obterPorPopularidade`);
            
            // Filtra a lista de séries no lado do cliente
            const seriesFiltradas = todasAsSeries.filter(serie => serie.vote_average > notaMinimaApi);
            
            // Reutiliza a função de renderização central
            await renderSeries(seriesFiltradas, `Nenhuma série encontrada com avaliação maior que ${notaMinimaUsuario}/100.`);

        } catch (error) {
            document.getElementById('main-content').innerHTML = '<p>Não foi possível carregar a lista de séries.</p>';
        }
    });
}


// --- Ponto de Entrada Principal ---
// Adiciona todos os eventos quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarTopSeries();
    setupFiltroPorId();
    setupFiltroPorNome();
    setupFiltroPorKeyword();
    setupFiltroPorPopularidade();
    setupFiltroPorLancamento();
    setupFiltroPorLinguagem();
    setupFiltroPorAvaliacao();
});