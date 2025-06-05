async function pegarDados() {
  const resposta = await fetch('https://api.enem.dev/v1/exams/2023/questions');
  const dados = await resposta.json();
  return dados;
}

// Usa a variável quando a promessa resolver
pegarDados().then(dados => {
  console.log('Agora a variável tem os dados:', dados);
});
