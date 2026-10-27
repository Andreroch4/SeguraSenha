/* =========================================================
   SCRIPT DO SITE "SEGURASENHA"
   Organização:
   1. Menu do celular
   2. Análise da senha (regras)
   3. Verificador (mostra o resultado na tela)
   4. Gerador de frase-senha
   5. Checklist
   6. Quiz
   Tudo roda no navegador: nada é enviado para a internet.
   ========================================================= */


/* ---------- 1. MENU DO CELULAR ---------- */

const botaoMenu = document.getElementById("botaoMenu");
const menu = document.getElementById("menu");

botaoMenu.addEventListener("click", function () {
  const aberto = menu.classList.toggle("aberto");
  botaoMenu.setAttribute("aria-expanded", aberto);
});

// Fecha o menu ao escolher uma opção
menu.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    menu.classList.remove("aberto");
    botaoMenu.setAttribute("aria-expanded", false);
  });
});


/* ---------- 2. ANÁLISE DA SENHA ---------- */

// Senhas e palavras muito usadas (os golpistas testam estas primeiro)
const PALAVRAS_COMUNS = [
  "123456", "1234567", "12345678", "123456789", "1234567890", "654321",
  "senha", "password", "admin", "qwerty", "abc123", "111111", "000000",
  "brasil", "amor", "deus", "jesus", "flamengo", "corinthians", "palmeiras",
  "saopaulo", "vasco", "gremio", "teamo", "iloveyou", "welcome", "login",
  "familia", "mudar", "acesso", "usuario"
];

// Sequências de teclado e do alfabeto
const SEQUENCIAS = [
  "abcdefghijklmnopqrstuvwxyz",
  "01234567890",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm"
];

// Troca números/símbolos que imitam letras (ex.: "s3nh@" vira "senha")
function normalizar(senha) {
  return senha
    .toLowerCase()
    .replace(/@|4/g, "a")
    .replace(/3/g, "e")
    .replace(/1|!/g, "i")
    .replace(/0/g, "o")
    .replace(/\$|5/g, "s")
    .replace(/7/g, "t");
}

// Verifica se a senha contém uma palavra comum
function contemPalavraComum(senha) {
  const original = senha.toLowerCase();
  const normalizada = normalizar(senha);
  return PALAVRAS_COMUNS.some(function (palavra) {
    return original.includes(palavra) || normalizada.includes(palavra);
  });
}

// Verifica se há 4 ou mais caracteres em sequência (ex.: "1234", "abcd", "4321")
function contemSequencia(senha) {
  const texto = senha.toLowerCase();
  for (const seq of SEQUENCIAS) {
    const invertida = seq.split("").reverse().join("");
    for (let i = 0; i <= seq.length - 4; i++) {
      if (texto.includes(seq.substr(i, 4)) || texto.includes(invertida.substr(i, 4))) {
        return true;
      }
    }
  }
  return false;
}

// Classifica o tamanho em curta, média ou longa
function classificarTamanho(tamanho) {
  if (tamanho <= 7) return "curta";
  if (tamanho <= 11) return "media";
  return "longa";
}

// Função principal: analisa a senha e devolve um "relatório"
function analisarSenha(senha) {
  const r = {
    tamanho: senha.length,
    categoria: classificarTamanho(senha.length),
    temMinuscula: /[a-z]/.test(senha),
    temMaiuscula: /[A-Z]/.test(senha),
    temNumero: /[0-9]/.test(senha),
    temSimbolo: /[^a-zA-Z0-9]/.test(senha),
    temPalavraComum: contemPalavraComum(senha),
    temSequencia: contemSequencia(senha),
    temRepeticao: /(.)\1\1/.test(senha),         // ex.: "aaa", "111"
    temAno: /(19|20)\d{2}/.test(senha)            // ex.: "1990", "2024"
  };

  // Quantos caracteres diferentes poderiam estar em cada posição
  let alfabeto = 0;
  if (r.temMinuscula) alfabeto += 26;
  if (r.temMaiuscula) alfabeto += 26;
  if (r.temNumero) alfabeto += 10;
  if (r.temSimbolo) alfabeto += 33;

  // "Bits de força": quanto maior, mais combinações possíveis
  let bits = r.tamanho * Math.log2(alfabeto || 1);

  // Penalidades: padrões previsíveis facilitam a vida do golpista
  if (r.temPalavraComum) bits *= 0.5;
  if (r.temSequencia) bits -= 10;
  if (r.temRepeticao) bits -= 8;
  if (r.temAno) bits -= 6;
  if (bits < 0) bits = 0;

  r.bits = bits;

  // Tempo estimado: computador testando 10 bilhões de senhas por segundo
  r.segundos = Math.pow(2, bits) / 2 / 1e10;

  // Nível de 0 (muito fraca) a 4 (muito forte)
  let nivel;
  if (bits < 30) nivel = 0;
  else if (bits < 45) nivel = 1;
  else if (bits < 60) nivel = 2;
  else if (bits < 80) nivel = 3;
  else nivel = 4;

  // Senha curta nunca passa de "fraca"; senha média nunca passa de "boa"
  if (r.categoria === "curta") nivel = Math.min(nivel, 1);
  if (r.categoria === "media") nivel = Math.min(nivel, 3);

  r.nivel = nivel;
  return r;
}

// Transforma segundos em um texto fácil de entender
function formatarTempo(segundos) {
  if (segundos < 1) return "menos de 1 segundo";

  const unidades = [
    { nome: "século", plural: "séculos", valor: 3153600000 },
    { nome: "ano", plural: "anos", valor: 31536000 },
    { nome: "mês", plural: "meses", valor: 2592000 },
    { nome: "dia", plural: "dias", valor: 86400 },
    { nome: "hora", plural: "horas", valor: 3600 },
    { nome: "minuto", plural: "minutos", valor: 60 },
    { nome: "segundo", plural: "segundos", valor: 1 }
  ];

  if (segundos > 3153600000 * 1000) return "mais de mil séculos 🎉";

  for (const u of unidades) {
    if (segundos >= u.valor) {
      const qtd = Math.floor(segundos / u.valor);
      return qtd + " " + (qtd === 1 ? u.nome : u.plural);
    }
  }
}


/* ---------- 3. VERIFICADOR (TELA) ---------- */

const campoSenha = document.getElementById("campoSenha");
const botaoMostrar = document.getElementById("botaoMostrar");
const medidorBarra = document.getElementById("medidorBarra");
const textoForca = document.getElementById("textoForca");
const textoTamanho = document.getElementById("textoTamanho");
const textoTempo = document.getElementById("textoTempo");
const listaCriterios = document.getElementById("listaCriterios");
const listaSugestoes = document.getElementById("listaSugestoes");

const NIVEIS = [
  { texto: "Muito fraca 😟", cor: "var(--cor-fraca)", largura: "15%" },
  { texto: "Fraca 😕", cor: "var(--cor-fraca)", largura: "35%" },
  { texto: "Razoável 😐", cor: "var(--cor-media)", largura: "55%" },
  { texto: "Boa 🙂", cor: "var(--cor-boa)", largura: "80%" },
  { texto: "Muito forte 💪", cor: "var(--cor-otima)", largura: "100%" }
];

const NOMES_CATEGORIA = { curta: "Curta", media: "Média", longa: "Longa" };

// Mostrar / esconder a senha digitada
botaoMostrar.addEventListener("click", function () {
  const escondida = campoSenha.type === "password";
  campoSenha.type = escondida ? "text" : "password";
  botaoMostrar.textContent = escondida ? "🙈 Esconder" : "👁️ Mostrar";
});

// Atualiza o resultado a cada tecla digitada
campoSenha.addEventListener("input", function () {
  atualizarVerificador(campoSenha.value);
});

function atualizarVerificador(senha) {
  // Campo vazio: volta ao estado inicial
  if (senha === "") {
    medidorBarra.style.width = "0";
    textoForca.textContent = "—";
    textoTamanho.textContent = "—";
    textoTempo.textContent = "—";
    listaCriterios.innerHTML = '<li class="vazio">Os critérios aparecem aqui.</li>';
    listaSugestoes.innerHTML = "<li>Digite uma senha acima para receber dicas.</li>";
    destacarCategoria(null);
    return;
  }

  const r = analisarSenha(senha);
  const nivel = NIVEIS[r.nivel];

  // Barra e resumo
  medidorBarra.style.width = nivel.largura;
  medidorBarra.style.background = nivel.cor;
  textoForca.textContent = nivel.texto;
  textoTamanho.textContent = r.tamanho + " caracteres (" + NOMES_CATEGORIA[r.categoria] + ")";
  textoTempo.textContent = formatarTempo(r.segundos);
  destacarCategoria(r.categoria);

  // Critérios: [condição atendida?, texto]
  const criterios = [
    [r.tamanho >= 12, "Tem 12 caracteres ou mais"],
    [r.temMinuscula, "Tem letras minúsculas (a-z)"],
    [r.temMaiuscula, "Tem letras maiúsculas (A-Z)"],
    [r.temNumero, "Tem números (0-9)"],
    [r.temSimbolo, "Tem símbolos (! @ # $ % - _)"],
    [!r.temPalavraComum, "Não usa palavras ou senhas muito comuns"],
    [!r.temSequencia, "Não tem sequências (1234, abcd, qwerty)"],
    [!r.temRepeticao, "Não repete o mesmo caractere várias vezes"],
    [!r.temAno, "Não parece ter um ano ou data (ex.: 1990)"]
  ];

  listaCriterios.innerHTML = criterios.map(function (c) {
    const ok = c[0];
    return '<li class="' + (ok ? "ok" : "nao") + '">' + (ok ? "✅ " : "❌ ") + c[1] + "</li>";
  }).join("");

  // Sugestões de melhoria
  const sugestoes = gerarSugestoes(r);
  listaSugestoes.innerHTML = sugestoes.map(function (s) {
    return "<li>" + s + "</li>";
  }).join("");

  if (sugestoes.length === 0) {
    listaSugestoes.innerHTML =
      '<li class="parabens">🎉 Ótima senha! Lembre-se: use-a em apenas um site e ative a verificação em duas etapas.</li>';
  }
}

// Cria dicas de acordo com o que está faltando
function gerarSugestoes(r) {
  const dicas = [];

  if (r.categoria === "curta") {
    dicas.push("Sua senha está <strong>curta</strong>. Aumente para pelo menos 12 caracteres. Dica: junte 3 ou 4 palavras, como <code>Sol-Bicicleta-Pao</code>.");
  } else if (r.categoria === "media") {
    dicas.push("Sua senha tem tamanho <strong>médio</strong>. Acrescente mais " + (12 - r.tamanho) + " caractere(s) para chegar a 12, o tamanho recomendado.");
  }

  if (r.temPalavraComum) {
    dicas.push("Ela contém uma palavra ou senha <strong>muito comum</strong>. Trocar letras por números (ex.: <code>s3nh@</code>) não engana os golpistas. Use palavras sem relação entre si.");
  }
  if (r.temSequencia) {
    dicas.push("Evite <strong>sequências</strong> como <code>1234</code>, <code>abcd</code> ou <code>qwerty</code>. São as primeiras a serem testadas.");
  }
  if (r.temRepeticao) {
    dicas.push("Evite <strong>repetir</strong> o mesmo caractere (ex.: <code>aaa</code>, <code>111</code>).");
  }
  if (r.temAno) {
    dicas.push("Parece haver um <strong>ano</strong> na senha. Datas de nascimento e anos especiais são fáceis de descobrir nas redes sociais.");
  }
  if (!r.temMaiuscula) {
    dicas.push("Coloque pelo menos uma letra <strong>MAIÚSCULA</strong>, de preferência no meio, e não só no começo.");
  }
  if (!r.temMinuscula) {
    dicas.push("Inclua letras <strong>minúsculas</strong>.");
  }
  if (!r.temNumero) {
    dicas.push("Adicione um ou mais <strong>números</strong>, de preferência fora do final da senha.");
  }
  if (!r.temSimbolo) {
    dicas.push("Use um <strong>símbolo</strong>, como <code>!</code>, <code>@</code>, <code>#</code> ou <code>-</code> para separar palavras.");
  }

  return dicas;
}

// Destaca o cartão da categoria (curta, média ou longa) da senha digitada
function destacarCategoria(categoria) {
  document.querySelectorAll(".categoria").forEach(function (cartao) {
    cartao.classList.toggle("ativa", categoria !== null && cartao.classList.contains(categoria));
  });
}


/* ---------- 4. GERADOR DE FRASE-SENHA ---------- */

// Palavras simples, sem acento, para facilitar a digitação
const PALAVRAS = [
  "abacaxi", "agua", "amarelo", "arvore", "azul", "balde", "banana", "barco",
  "bicicleta", "bola", "bolo", "cadeira", "cafe", "caderno", "caneca", "carro",
  "casa", "cavalo", "cebola", "chuva", "cidade", "coelho", "colher", "copo",
  "doce", "escada", "estrela", "faca", "feijao", "festa", "flor", "floresta",
  "fogao", "folha", "foguete", "fruta", "gato", "girafa", "gelo", "janela",
  "jardim", "lapis", "laranja", "leite", "leao", "livro", "lua", "macaco",
  "mala", "manga", "mar", "mesa", "milho", "montanha", "nuvem", "ovo",
  "panela", "papel", "pato", "peixe", "pedra", "pipoca", "planeta", "ponte",
  "porta", "praia", "queijo", "radio", "relogio", "rio", "rosa", "sapato",
  "sino", "sol", "sopa", "tapete", "tartaruga", "telhado", "tigre", "tomate",
  "trem", "uva", "vaca", "varanda", "vela", "verde", "vento", "violao", "zebra"
];

const SIMBOLOS = ["-", "_", ".", "!", "#", "@", "+", "*"];

const senhaGerada = document.getElementById("senhaGerada");
const mensagemGerador = document.getElementById("mensagemGerador");

// Número aleatório seguro entre 0 e (maximo - 1)
function aleatorio(maximo) {
  if (window.crypto && window.crypto.getRandomValues) {
    const numeros = new Uint32Array(1);
    window.crypto.getRandomValues(numeros);
    return numeros[0] % maximo;
  }
  return Math.floor(Math.random() * maximo);
}

function capitalizar(palavra) {
  return palavra.charAt(0).toUpperCase() + palavra.slice(1);
}

function gerarFraseSenha() {
  const quantidade = Number(document.getElementById("quantidadePalavras").value);
  const comNumero = document.getElementById("incluirNumero").checked;
  const comSimbolo = document.getElementById("incluirSimbolo").checked;

  const palavras = [];
  for (let i = 0; i < quantidade; i++) {
    palavras.push(capitalizar(PALAVRAS[aleatorio(PALAVRAS.length)]));
  }

  if (comNumero) {
    palavras.push(String(aleatorio(90) + 10)); // número de 10 a 99
  }

  const separador = comSimbolo ? SIMBOLOS[aleatorio(SIMBOLOS.length)] : "";
  return palavras.join(separador);
}

document.getElementById("botaoGerar").addEventListener("click", function () {
  senhaGerada.textContent = gerarFraseSenha();
  mensagemGerador.textContent = "";
});

// Copiar a senha gerada
document.getElementById("botaoCopiar").addEventListener("click", function () {
  const texto = senhaGerada.textContent;
  if (texto === 'Clique em "Gerar"') {
    mensagemGerador.textContent = "Primeiro clique em Gerar.";
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(function () {
      mensagemGerador.textContent = "✅ Senha copiada!";
    }, function () {
      mensagemGerador.textContent = "Não foi possível copiar. Selecione e copie manualmente.";
    });
  } else {
    mensagemGerador.textContent = "Seu navegador não permite copiar automaticamente. Selecione e copie manualmente.";
  }
});

// Leva a senha gerada para o verificador
document.getElementById("botaoTestar").addEventListener("click", function () {
  const texto = senhaGerada.textContent;
  if (texto === 'Clique em "Gerar"') {
    mensagemGerador.textContent = "Primeiro clique em Gerar.";
    return;
  }
  campoSenha.value = texto;
  atualizarVerificador(texto);
  document.getElementById("verificador").scrollIntoView();
});


/* ---------- 5. CHECKLIST ---------- */

const caixasChecklist = document.querySelectorAll("#listaChecklist input");
const textoChecklist = document.getElementById("textoChecklist");
const barraChecklist = document.getElementById("barraChecklist");

function atualizarChecklist() {
  let marcados = 0;
  caixasChecklist.forEach(function (caixa) {
    if (caixa.checked) marcados++;
  });

  barraChecklist.style.width = (marcados / caixasChecklist.length) * 100 + "%";

  let texto = "Você marcou " + marcados + " de " + caixasChecklist.length + " itens.";
  if (marcados === caixasChecklist.length) {
    texto += " 🏆 Parabéns, você está muito bem protegido!";
  } else if (marcados >= 3) {
    texto += " 👍 Bom caminho! Falta pouco.";
  }
  textoChecklist.textContent = texto;
}

caixasChecklist.forEach(function (caixa) {
  caixa.addEventListener("change", atualizarChecklist);
});


/* ---------- 6. QUIZ ---------- */

// Cada pergunta: texto, opções, índice da resposta certa e explicação
const PERGUNTAS = [
  {
    pergunta: "Qual destas senhas é a mais segura?",
    opcoes: ["Joao1985", "P@ssw0rd", "Janela-Azul-Pipoca-42"],
    certa: 2,
    explicacao: "A frase-senha é longa e não usa informações pessoais nem palavras comuns."
  },
  {
    pergunta: "Posso usar a mesma senha no e-mail e no banco?",
    opcoes: ["Sim, se ela for forte", "Não, cada conta deve ter sua própria senha"],
    certa: 1,
    explicacao: "Se um site vazar sua senha, todas as contas com a mesma senha ficam em risco."
  },
  {
    pergunta: "Alguém liga dizendo ser do banco e pede sua senha. O que fazer?",
    opcoes: ["Informar a senha para resolver rápido", "Desligar e ligar para o número oficial do banco"],
    certa: 1,
    explicacao: "Bancos nunca pedem sua senha. Isso é golpe!"
  },
  {
    pergunta: "O que é a verificação em duas etapas?",
    opcoes: [
      "Digitar a senha duas vezes",
      "Uma segunda confirmação, como um código no celular",
      "Ter duas senhas diferentes para a mesma conta"
    ],
    certa: 1,
    explicacao: "Mesmo que descubram sua senha, ainda precisariam do código do seu celular."
  },
  {
    pergunta: "O que deixa uma senha mais forte?",
    opcoes: ["Ser longa", "Ter o nome do meu pet", "Ser fácil de adivinhar"],
    certa: 0,
    explicacao: "O tamanho é o fator mais importante. Prefira 12 caracteres ou mais."
  }
];

const quizContador = document.getElementById("quizContador");
const quizPergunta = document.getElementById("quizPergunta");
const quizOpcoes = document.getElementById("quizOpcoes");
const quizExplicacao = document.getElementById("quizExplicacao");
const quizProxima = document.getElementById("quizProxima");

let perguntaAtual = 0;
let acertos = 0;

function mostrarPergunta() {
  const p = PERGUNTAS[perguntaAtual];
  quizContador.textContent = "Pergunta " + (perguntaAtual + 1) + " de " + PERGUNTAS.length;
  quizPergunta.textContent = p.pergunta;
  quizExplicacao.textContent = "";
  quizProxima.classList.add("escondido");
  quizOpcoes.innerHTML = "";

  p.opcoes.forEach(function (opcao, indice) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = opcao;
    botao.addEventListener("click", function () {
      responder(indice);
    });
    quizOpcoes.appendChild(botao);
  });
}

function responder(indiceEscolhido) {
  const p = PERGUNTAS[perguntaAtual];
  const botoes = quizOpcoes.querySelectorAll("button");

  botoes.forEach(function (botao, indice) {
    botao.disabled = true;
    if (indice === p.certa) botao.classList.add("correta");
    else if (indice === indiceEscolhido) botao.classList.add("errada");
  });

  if (indiceEscolhido === p.certa) {
    acertos++;
    quizExplicacao.textContent = "✅ Correto! " + p.explicacao;
  } else {
    quizExplicacao.textContent = "❌ Não foi dessa vez. " + p.explicacao;
  }

  quizProxima.textContent = perguntaAtual < PERGUNTAS.length - 1 ? "Próxima pergunta" : "Ver resultado";
  quizProxima.classList.remove("escondido");
}

function mostrarResultado() {
  quizContador.textContent = "Fim do quiz!";
  quizPergunta.textContent = "Você acertou " + acertos + " de " + PERGUNTAS.length + " perguntas.";
  quizOpcoes.innerHTML = "";
  quizExplicacao.textContent = acertos === PERGUNTAS.length
    ? "🏆 Excelente! Você já sabe se proteger."
    : "Continue aprendendo! Releia as seções acima e tente de novo.";
  quizProxima.textContent = "Jogar novamente";
  quizProxima.classList.remove("escondido");
}

quizProxima.addEventListener("click", function () {
  if (perguntaAtual >= PERGUNTAS.length) {
    // Reinicia o quiz
    perguntaAtual = 0;
    acertos = 0;
    mostrarPergunta();
    return;
  }

  perguntaAtual++;
  if (perguntaAtual < PERGUNTAS.length) mostrarPergunta();
  else mostrarResultado();
});

mostrarPergunta();
