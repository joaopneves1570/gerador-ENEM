document.getElementById('form-filtro').addEventListener('submit', async function (e) {
    e.preventDefault(); // Impede o envio padrão do formulário
    const ano = document.getElementById("anos").value; // Pega o valor do ano selecionado
    const materia = document.getElementById("disciplinas").value; // Pega a disciplina selecionada

    // Armazena os filtros atuais para usar no caso do usuario refazer as questoes
    filtroAtualAno = ano;
    filtroAtualMateria = materia;

    zerarPontuacao(); // Reseta a pontuação
    zerarQuestao(); // Zera o número de questões
    await carregarQuestoes(materia, ano); // Carrega as questões com base nos filtros
});

// Variáveis globais para as questões e filtro
let questoesFiltradas = [];
let indiceAtual = 0;
let filtroAtualAno = null;
let filtroAtualMateria = null;

// Função para buscar as questões na API
async function carregarQuestoes(materia, ano) {
    let res;

    try {
        // No caso do inglês parece que tem um parâmetro diferente chamado "language"
        if (materia === "Inglês") {
            res = await fetch(`https://api.enem.dev/v1/exams/${ano}/questions?limit=45&offset=1&language=ingles`);
        } else {
            // Analisa a posição da matéria
            res = await fetch(`https://api.enem.dev/v1/exams/${ano}/questions?limit=45&offset=${(materia * 45) + 1}`);
        }

        // Verifica erros de requisicão com a API
        if (!res.ok) throw new Error('Erro na requisição');

        // transforma os dados em JSON
        const dados = await res.json();

        // questões filtradas
        questoesFiltradas = dados.questions || [];

        // Se não encontrar questões, exibe essa mensagem
        if (questoesFiltradas.length === 0) {
            document.getElementById('questao-container').innerHTML = "<p>Nenhuma questão encontrada.</p>";
            return;
        }

        // Reinicia o índice e mostra a primeira questão
        indiceAtual = 0;
        mostrarQuestao(questoesFiltradas[indiceAtual]);

    } catch (err) {
        // tratando erro ao buscar questões
        console.error(err);
        document.getElementById('questao-container').innerHTML = "<p>Ocorreu um erro ao buscar questões.</p>";
    }
}

// Verifica as questoes para evitar problemas
function ValidarQuestao(questao) {
    if (!questao || !questao.alternatives || !questao.context) return false;

    const contexto = questao.context;
    const alternativas = Object.values(questao.alternatives || {});

    // Verifica se não tem caracteres de típicos de urls de imagens quebradas ou coisa do tipo
    if (/!\[.*?\]\(.*?\)/.test(contexto)) return false;

    // Verifica se tem tags HTML com problemas ou soltas nas questoes
    if (/<br\s*\/?>|&nbsp;|&quot;|&#/.test(contexto)) return false;

    // Verifica se não está faltando alternativas
    if (alternativas.length !== 5) return false;

    // Verifica se todas as alternativas uma certa quantia de texto
    if (!alternativas.every(alt => alt?.text && alt.text.trim().length >= 10)) return false;

    // Verifica se tem aspas no final da alternativa
    if (alternativas.some(alt => /[“”"]\s*$/.test(alt.text.trim()))) return false;

    return true;
}

// Mostra a questao
function mostrarQuestao(questao) {
    const container = document.getElementById("questao-container");

    // Se a questao estiver zuada, vai para a próxima
    if (!ValidarQuestao(questao)) {
        indiceAtual++;
        if (indiceAtual < questoesFiltradas.length) {
            mostrarQuestao(questoesFiltradas[indiceAtual]);
        } else {
            mostrarResultadoFinal(); // caso as questoes para o filtro acabem,mostra o resultado
        }
        return;
    }

    // HTML das alternativas
    const alternativas = Object.values(questao.alternatives || {});
    const alternativasHTML = alternativas.map(alt => `
        <li data-resposta="${alt.letter}">${alt.letter}: <span class="alt-text">${alt.text}</span></li>
    `).join("");

    // Mostra as questoes e alternativas
    container.innerHTML = `
        <div class="questao">
            <h3>${questao.title} (${questao.year})</h3>
            <div>${questao.context}</div>
            <p>${questao.alternativesIntroduction || ''}</p>
            <ul>${alternativasHTML}</ul>
            <p id="feedback" class="feedback"></p>
            <button id="proxima">Próxima questão</button>
        </div>
    `;

    let respondeu = false;
    contaQuestao();

    // Eventos de clique nas alternativas
    document.querySelectorAll(".questao li").forEach(li => {
        li.addEventListener("click", function () {
            respondeu = true;

            // Impede vários clicks por parte do usuario
            document.querySelectorAll(".questao li").forEach(el => el.style.pointerEvents = "none");

            const sel = this.getAttribute("data-resposta"); // Alternativa que foi escolhida
            const correto = questao.correctAlternative; // Alternativa certa
            const feedbackEl = document.getElementById("feedback");

            // Vê se a resposta está certa ou errada
            if (sel === correto) {
                this.classList.add("correto");
                feedbackEl.textContent = "✅ Você acertou!";
                FazerPontos(); // soma na pontuacao
            } else {
                this.classList.add("errado");
                const liCorreta = document.querySelector(`li[data-resposta="${correto}"]`);
                if (liCorreta) liCorreta.classList.add("correto");
                feedbackEl.textContent = `❌ Errado! Resposta certa: ${correto}`;
            }
        });
    });

    // Botao proxima questao
    document.getElementById("proxima").addEventListener("click", function () {
        if (!respondeu) {
            return; // evita do usuario ir para proxima questao sem responder
        }
        respondeu = false;
        indiceAtual++;
        if (indiceAtual < questoesFiltradas.length) {
            mostrarQuestao(questoesFiltradas[indiceAtual]);
        } else {
            mostrarResultadoFinal();
        }
    });
}

// Carrega a pontuacao do locastorage
function carregarPontuacao() {
    const pontos = localStorage.getItem("pontuacao");
    return pontos ? parseInt(pontos) : 0;
}

//  + 1 ponto por acerto
function FazerPontos() {
    var atual = carregarPontuacao();
    atual = atual + 1;
    localStorage.setItem("pontuacao", atual);
    console.log("Pontuação atual:", atual);
}

// Volta a pontuação para zero
function zerarPontuacao() {
    localStorage.setItem("pontuacao", 0);
    console.log("Pontuação atual:", 0);
}

// Retorna a quantidade de questões respondidas
function quantidadeQuestoes() {
    const pontos = localStorage.getItem("questao");
    return pontos ? parseInt(pontos) : 0;
}

// Soma 1 no número de questões respondidas
function contaQuestao(){
    var questao = quantidadeQuestoes();
    questao = questao + 1;
    localStorage.setItem("questao", questao);
    console.log("Número Questões:", questao);

}

// Volta o número de questões para zero
function zerarQuestao() {
    localStorage.setItem("questao", 0);
    console.log("Número Questões:", 0);
}

// tela de resultado final, ao concluir o simulado
function mostrarResultadoFinal() {
    const container = document.getElementById("questao-container");
    const total = quantidadeQuestoes();
    const acertos = carregarPontuacao();

    container.classList.add("resultado-final");
    container.innerHTML = `
        <h2>Simulado finalizado!</h2>
        <p>Você acertou <strong>${acertos}</strong> de <strong>${total}</strong> questões.</p>
        <button id="refazer">Refazer quiz</button>
    `;

    // Botão para refazer o quiz com os mesmos filtros
    document.getElementById("refazer").addEventListener("click", async () => {
        container.classList.remove("resultado-final");
        zerarPontuacao();
        await carregarQuestoes(filtroAtualMateria, filtroAtualAno);
    });
}
