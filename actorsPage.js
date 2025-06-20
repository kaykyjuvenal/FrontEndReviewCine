// Importa as funções reutilizáveis do nosso módulo de serviço
import { fetchData, getPosterUrl, createActorCardHtml, BASE_API_URL } from './apiService.js';

// Chave da API do TMDB para buscar imagens
const TMDB_API_KEY = 'cd190993f189e0a225dc0799ddb4b9d1';
// Constante para as opções de gênero
const GENEROS = [
    { nome: 'Feminino', codigo: 1 },
    { nome: 'Masculino', codigo: 2 }
];


/**
 * Função central para renderizar qualquer lista de PESSOAS na tela.
 * Ela cuida de buscar as fotos de perfil e montar os cards em lotes.
 * @param {Array} pessoaList - A lista de objetos de pessoa a ser exibida.
 * @param {string} [notFoundMessage='Ninguém foi encontrado.'] - Mensagem para exibir se a lista estiver vazia.
 */
async function renderPessoas(pessoaList, notFoundMessage = 'Nenhum resultado encontrado para este filtro.') {
    const actorGrid = document.getElementById('actor-grid');
    if (!pessoaList || pessoaList.length === 0) {
        actorGrid.innerHTML = `<p>${notFoundMessage}</p>`;
        return;
    }
    actorGrid.innerHTML = '';

    // Mapeia a lista de pessoas para uma lista de promessas de criar os cards
    const cardPromises = pessoaList.map(async (pessoa) => {
        let profileUrl = '';
        try {
            // Busca os detalhes da pessoa no TMDB para pegar a foto
            const pessoaDetails = await fetchData(`https://api.themoviedb.org/3/person/${pessoa.id}?api_key=${TMDB_API_KEY}`);
            if (pessoaDetails.profile_path) {
                profileUrl = `https://image.tmdb.org/t/p/w185${pessoaDetails.profile_path}`;
            }
        } catch (error) {
            console.warn(`Não foi possível buscar foto para a pessoa ID ${pessoa.id}`);
        }
        // Utiliza a função do apiService para criar o HTML do card
        return createActorCardHtml(pessoa, profileUrl);
    });

    const cardsHtml = await Promise.all(cardPromises);
    actorGrid.innerHTML = cardsHtml.join('');
}

/**
 * Carrega as pessoas mais populares ao iniciar a página.
 */
async function carregarPessoasPopulares() {
    document.getElementById('actor-grid').innerHTML = '<p>Carregando pessoas mais populares...</p>';
    try {
        const topPessoas = await fetchData(`${BASE_API_URL}/pessoas/obterTop10Populares`);
        await renderPessoas(topPessoas);
    } catch (error) {
        document.getElementById('actor-grid').innerHTML = '<p>Não foi possível carregar as pessoas.</p>';
    }
}

/**
 * Configura o botão de filtro por ID.
 * Exibe o único resultado encontrado.
 */
function setupFiltroPorId() {
    document.getElementById('filtro-id-ator-btn').addEventListener('click', async () => {
        const id = prompt("Digite o ID da pessoa/ator:");
        if (!id || isNaN(id)) return;
        document.getElementById('actor-grid').innerHTML = `<p>Buscando pessoa com ID ${id}...</p>`;
        try {
            const pessoa = await fetchData(`${BASE_API_URL}/pessoas/${id}`);
            await renderPessoas([pessoa]); // renderPessoas espera uma lista, então passamos o resultado em um array
        } catch (error) {
            await renderPessoas([], `Pessoa com ID ${id} não encontrada.`);
        }
    });
}

/**
 * Configura o botão de filtro por nome exato.
 * Exibe o único resultado encontrado.
 */
function setupFiltroPorNomeExato() {
    document.getElementById('filtro-nome-ator-btn').addEventListener('click', async () => {
        const nome = prompt("Digite o nome EXATO da pessoa:");
        if (!nome || nome.trim() === '') return;
        document.getElementById('actor-grid').innerHTML = `<p>Buscando por "${nome}"...</p>`;
        try {
            const pessoa = await fetchData(`${BASE_API_URL}/pessoas/obterPorNome?nome=${encodeURIComponent(nome)}`);
            await renderPessoas([pessoa]);
        } catch (error) {
            await renderPessoas([], `Pessoa com nome "${nome}" não encontrada.`);
        }
    });
}

/**
 * Configura o botão de filtro por palavra-chave no nome.
 */
function setupFiltroPorPalavraChave() {
    document.getElementById('filtro-keyword-ator-btn').addEventListener('click', async () => {
        const keyword = prompt("Digite parte do nome da pessoa:");
        if (!keyword || keyword.trim() === '') return;
        document.getElementById('actor-grid').innerHTML = `<p>Buscando por "${keyword}"...</p>`;
        try {
            const pessoas = await fetchData(`${BASE_API_URL}/pessoas/obterPorParteDoNome?nome=${encodeURIComponent(keyword)}`);
            await renderPessoas(pessoas, `Ninguém encontrado com o nome contendo "${keyword}".`);
        } catch (error) {
            document.getElementById('actor-grid').innerHTML = `<p>Erro ao buscar por nome.</p>`;
        }
    });
}

/**
 * Configura o botão de filtro por personagem.
 */
function setupFiltroPorPersonagem() {
    document.getElementById('filtro-personagem-btn').addEventListener('click', async () => {
        const personagem = prompt("Digite o nome do personagem:");
        if (!personagem || personagem.trim() === '') return;
        document.getElementById('actor-grid').innerHTML = `<p>Buscando por personagem "${personagem}"...</p>`;
        try {
            const pessoas = await fetchData(`${BASE_API_URL}/pessoas/obterPorPersonagem?personagem=${encodeURIComponent(personagem)}`);
            await renderPessoas(pessoas, `Ninguém encontrado que interpretou "${personagem}".`);
        } catch (error) {
            document.getElementById('actor-grid').innerHTML = `<p>Erro ao buscar por personagem.</p>`;
        }
    });
}

/**
 * Configura o botão de filtro por departamento usando um modal.
 */
function setupFiltroPorDepartamento() {
    const filtroBtn = document.getElementById('filtro-departamento-btn');
    // ... (A lógica do modal de departamento que já criamos pode ser inserida aqui,
    // garantindo que a chamada final seja 'await renderPessoas(pessoasFiltradas, ...)')
    // Para simplificar, faremos com prompt, mas o ideal é o modal.
     filtroBtn.addEventListener('click', async () => {
        const depto = prompt("Digite o departamento (ex: Acting, Directing):");
        if (!depto || depto.trim() === '') return;
        document.getElementById('actor-grid').innerHTML = `<p>Buscando no departamento "${depto}"...</p>`;
        try {
            const pessoas = await fetchData(`${BASE_API_URL}/pessoas/obterPorDepartamento?departamento=${encodeURIComponent(depto)}`);
            await renderPessoas(pessoas, `Ninguém encontrado no departamento "${depto}".`);
        } catch (error) {
            document.getElementById('actor-grid').innerHTML = `<p>Erro ao buscar por departamento.</p>`;
        }
    });
}

/**
 * Configura o botão de filtro por popularidade.
 */
function setupFiltroPorPopularidade() {
    document.getElementById('filtro-popularidade-ator-btn').addEventListener('click', async () => {
        const popularidadeMinimaStr = prompt("Exibir pessoas com popularidade MAIOR que (ex: 10):");
        if (!popularidadeMinimaStr || isNaN(popularidadeMinimaStr)) return;
        const popularidadeMinima = parseFloat(popularidadeMinimaStr);
        document.getElementById('actor-grid').innerHTML = `<p>Buscando pessoas com popularidade > ${popularidadeMinima}...</p>`;
        try {
            const todasAsPessoas = await fetchData(`${BASE_API_URL}/pessoas/obterPorPopularidade`);
            const pessoasFiltradas = todasAsPessoas.filter(p => p.popularity > popularidadeMinima);
            await renderPessoas(pessoasFiltradas, `Ninguém encontrado com popularidade maior que ${popularidadeMinima}.`);
        } catch (error) {
            document.getElementById('actor-grid').innerHTML = `<p>Erro ao carregar lista de pessoas.</p>`;
        }
    });
}
/**
 * Configura o filtro por gênero (sexo) da pessoa.
 */
async function setupFiltroPorGenero() {
    const filtroBtn = document.getElementById('filtro-genero-btn');
    const modal = document.getElementById('gender-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const genderListDiv = document.getElementById('gender-list');

    if (!filtroBtn || !modal || !closeBtn) return;

    // Evento para abrir o modal
    filtroBtn.addEventListener('click', (event) => {
        event.preventDefault();
        
        genderListDiv.innerHTML = ''; // Limpa a lista antes de adicionar os botões
        
        // Cria os botões para as opções de gênero
        GENEROS.forEach(genero => {
            const genderButton = document.createElement('button');
            genderButton.className = 'gender-item';
            genderButton.textContent = genero.nome;
            
            // Adiciona o evento de clique para cada botão
            genderButton.addEventListener('click', () => {
                modal.style.display = 'none'; // Esconde o modal
                buscarPessoasPorGenero(genero.codigo, genero.nome);
            });
            
            genderListDiv.appendChild(genderButton);
        });
        
        modal.style.display = 'block'; // Exibe o modal
    });

    // Eventos para fechar o modal
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    async function buscarPessoasPorGenero(genderCode, genderName) {
        document.getElementById('actor-grid').innerHTML = `<p>Buscando pessoas do gênero '${genderName}'...</p>`;
        try {
            const todasAsPessoas = await fetchData(`${BASE_API_URL}/pessoas/obterPorPopularidade`);
            const pessoasFiltradas = todasAsPessoas.filter(pessoa => pessoa.gender === genderCode);
            await renderPessoas(pessoasFiltradas, `Nenhuma pessoa encontrada do gênero '${genderName}'.`);
        } catch (error) {
            document.getElementById('actor-grid').innerHTML = `<p>Erro ao buscar por gênero.</p>`;
        }
    }
}


// --- Ponto de Entrada Principal ---
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoasPopulares();
    setupFiltroPorId();
    setupFiltroPorNomeExato();
    setupFiltroPorPalavraChave();
    setupFiltroPorPersonagem();
    setupFiltroPorDepartamento();
    setupFiltroPorPopularidade();
    setupFiltroPorGenero(); // <-- Chamada da nova função
});


