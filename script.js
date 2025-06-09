document.getElementById('form-filtro').addEventListener('submit', async function (e) {
    e.preventDefault();
    const ano = document.getElementById("anos").value;
    await carregarQuestoes(ano);
});

let questoesFiltradas = [];
let indiceAtual = 0;

// Está faltando filtrar por disciplinas :(

async function carregarQuestoes(ano) {
    try {
        const res = await fetch(`https://api.enem.dev/v1/exams/${ano}/questions`);
        if (!res.ok) throw new Error('Erro na requisição');
        const dados = await res.json();

        questoesFiltradas = dados.questions || [];

        if (questoesFiltradas.length === 0) {
            document.getElementById('questao-container').innerHTML = "<p>Nenhuma questão encontrada.</p>";
            return;
        }

        indiceAtual = 0;
        mostrarQuestao(questoesFiltradas[indiceAtual]);
    } catch (err) {
        console.error(err);
        document.getElementById('questao-container')
            .innerHTML = "<p>Ocorreu um erro ao buscar questões.</p>";
    }
}

function mostrarQuestao(questao) {
    const container = document.getElementById("questao-container");
    const contexto = marked.parse((questao.context || '').replace(/\n/g, '\n\n'));

    // monta lista de alternativas
    const alternativasHTML = questao.alternatives.map(alt => `
        <li data-resposta="${alt.letter}">${alt.letter}: ${alt.text}</li>
    `).join("");

    // coloca no DOM  um <p id="feedback"> para a mensagem
    container.innerHTML = `
        <div class="questao">
            <h3>${questao.title} (${questao.year})</h3>
            <div>${contexto}</div>
            <p>${questao.alternativesIntroduction || ''}</p>
            <ul>${alternativasHTML}</ul>
            <p id="feedback" class="feedback"></p>
            <button id="proxima">Próxima questão</button>
        </div>
    `;

    // adiciona evento em cada <li>
    document.querySelectorAll(".questao li").forEach(li => {
        li.addEventListener("click", function () {
            // desativa cliques múltiplos
            document.querySelectorAll(".questao li")
                .forEach(el => el.style.pointerEvents = "none");

            const sel = this.getAttribute("data-resposta");
            const correto = questao.correct;
            const feedbackEl = document.getElementById("feedback");

            // Precisa arrumar essa correção das alternativas
            
            if (sel === correto) {
                this.classList.add("correto");
                feedbackEl.textContent = "✅ Você acertou!";
            } else {
                this.classList.add("errado");
                // destaca também a correta
                const liCorreta = document.querySelector(`li[data-resposta="${correto}"]`);
                if (liCorreta) liCorreta.classList.add("correto");

                // Encontra o texto da alternativa certa
                const altCorretaObj = questao.alternatives.find(a => a.letter === correto);
                const textoCorreta = altCorretaObj ? altCorretaObj.text : '';
                feedbackEl.textContent = `❌ Errado! A resposta certa é ${correto}: ${textoCorreta}`;
            }
        });
    });

    // Botão para a próxima questão 
    document.getElementById("proxima").addEventListener("click", function () {
        indiceAtual++;
        if (indiceAtual < questoesFiltradas.length) {
            mostrarQuestao(questoesFiltradas[indiceAtual]);
        } else {
            container.innerHTML = "<p>Fim das questões disponíveis para este filtro.</p>";
        }
    });
}
