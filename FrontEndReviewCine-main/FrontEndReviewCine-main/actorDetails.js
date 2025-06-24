import { fetchData } from './apiService.js';

const TMDB_API_KEY = 'cd190993f189e0a225dc0799ddb4b9d1';

async function carregarDetalhesPessoa() {
    const mainElement = document.getElementById('main-details-pessoa');
    const urlParams = new URLSearchParams(window.location.search);
    const pessoaId = urlParams.get('id');

    if (!pessoaId) {
        mainElement.innerHTML = "<p>Nenhum ID de pessoa foi fornecido na URL.</p>";
        return;
    }

    try {
        // ETAPA 1: Buscar detalhes da pessoa e seus créditos em paralelo
        const detailsUrl = `https://api.themoviedb.org/3/person/${pessoaId}?api_key=${TMDB_API_KEY}&language=pt-BR`;
        const creditsUrl = `https://api.themoviedb.org/3/person/${pessoaId}/combined_credits?api_key=${TMDB_API_KEY}&language=pt-BR`;
        
        const [pessoaDetails, creditsData] = await Promise.all([
            fetchData(detailsUrl),
            fetchData(creditsUrl)
        ]);

        // Atualiza o título da página
        document.title = pessoaDetails.name;
        const profileUrl = pessoaDetails.profile_path ? `https://image.tmdb.org/t/p/w500${pessoaDetails.profile_path}` : '';

        // ETAPA 2: Filtrar e ordenar os trabalhos para a galeria "Conhecido(a) por:"
        const filmesComPoster = creditsData.cast.filter(obra => obra.media_type === 'movie' && obra.poster_path);
        const seriesComPoster = creditsData.cast.filter(obra => obra.media_type === 'tv' && obra.poster_path);

        // Agora, montamos a lista 'obrasConhecidas' usando apenas os resultados que têm imagem.
        let obrasConhecidas = filmesComPoster.slice(0, 4);
        if (obrasConhecidas.length < 4) {
           const seriesNecessarias = 4 - obrasConhecidas.length;
           obrasConhecidas.push(...seriesComPoster.slice(0, seriesNecessarias));
        }

        // ETAPA 3: Montar o HTML da galeria
        let galeriaHtml = obrasConhecidas.map(obra => {
            const posterUrl = obra.poster_path ? `https://image.tmdb.org/t/p/w185${obra.poster_path}` : '';
            const linkType = obra.media_type;
            const linkTitle = obra.title || obra.name;
            return `
                <a href="details.html?id=${obra.id}&type=${linkType}" title="${linkTitle}">
                    <div class="obra-card">
                        ${posterUrl ? `<img src="${posterUrl}" alt="Pôster de ${linkTitle}">` : 'Sem Imagem'}
                    </div>
                </a>
            `;
        }).join('');

        // ETAPA 4: Montar o HTML final da página
        const pageHtml = `
            <div class="topo-pessoa">
                <div class="col-esq-pessoa">
                    <div class="titulo-pessoa">${pessoaDetails.name}</div>
                    <div class="perfil-img-container">
                        ${profileUrl ? `<img src="${profileUrl}" alt="Foto de ${pessoaDetails.name}">` : 'Sem Foto'}
                    </div>
                </div>
                <div class="col-dir-pessoa">
                    <div class="titulo-pessoa">Biografia</div>
                    <div class="biografia">
                        ${pessoaDetails.biography || 'Biografia não disponível em português.'}
                    </div>
                </div>
            </div>
            <div class="galeria">
                <div class="titulo-pessoa">Conhecido(a) por:</div>
                <div class="galeria-grid">
                    ${galeriaHtml}
                </div>
            </div>
        `;

        mainElement.innerHTML = pageHtml;

    } catch (error) {
        console.error("Erro ao carregar detalhes da pessoa:", error);
        mainElement.innerHTML = `<p>Não foi possível carregar os detalhes desta pessoa.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', carregarDetalhesPessoa);