async function buscarQuestoes(ano) {
    const resposta = await fetch(`https://api.enem.dev/v1/exams/${ano}/questions`);
    const dados = await resposta.json();
    const questoes = dados.questions;

    const container = document.getElementById("container");
    container.innerHTML = "";

    questoes.forEach((questao) => {

      // Trata o Markdown: substitui quebras simples por duplas
      const contextoTratado = marked.parse((questao.context || '').replace(/\n/g, '\n\n'));

      const blocoHTML = `
        <div class="questao">
          <h3>${questao.title} (${questao.year})</h3>
          <div>${contextoTratado}</div>
          <p>${questao.alternativesIntroduction}</p>
          <ul>
            ${questao.alternatives.map(alt => `<li>${alt.letter}: ${alt.text}</li>`).join("")}
          </ul>
          <hr>
        </div>
      `;

      container.insertAdjacentHTML('beforeend', blocoHTML);
    });
  }

function selecao() {
    const ano = document.getElementById("anos").value;
    const disciplina = document.getElementById("disciplinas").value;

    console.log("Ano selecionado:", ano);
    console.log("Disciplina selecionada:", disciplina);

    buscarQuestoes(ano);
}
