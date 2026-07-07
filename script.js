const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxSWemrgsrkqfYa_8yEzqZySSYthA8q1s2rSOUQ1ISFiyWgffJKxJ9sJ5RHnFWdvZBI/exec";

let horaInicio = null;
let horaFim = null;
let intervaloTimer = null;
let itens = [];

window.onload = function () {
  carregarDados();
};

async function carregarDados() {
  try {
    const resposta = await fetch(WEB_APP_URL);
    const dados = await resposta.json();

    preencherSelect("ajudante", dados.ajudantes, "Selecione o ajudante");
    preencherSelect("tipo", dados.tipos, "Selecione o tipo");
    preencherSelect("motivo", dados.motivos, "Selecione o motivo");

  } catch (erro) {
    mostrarMensagem("Erro ao carregar dados da planilha.", "erro");
  }
}

function preencherSelect(id, lista, textoPadrao) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">${textoPadrao}</option>`;

  lista.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

function iniciarAfericao() {
  const ajudante = document.getElementById("ajudante").value;

  if (!ajudante) {
    mostrarMensagem("Selecione o ajudante antes de iniciar.", "erro");
    return;
  }

  horaInicio = new Date();

  document.getElementById("btnIniciar").disabled = true;
  document.getElementById("ajudante").disabled = true;

  document.getElementById("areaTimer").style.display = "block";
  document.getElementById("areaRegistro").style.display = "block";
  document.getElementById("areaLista").style.display = "block";

  document.getElementById("horaInicioTexto").textContent =
    "Iniciado às " + formatarHora(horaInicio);

  intervaloTimer = setInterval(atualizarTimer, 1000);

  mostrarMensagem("Aferição iniciada.", "sucesso");
}

function atualizarTimer() {
  const agora = new Date();
  const diferenca = agora - horaInicio;

  document.getElementById("timer").textContent = formatarTempo(diferenca);
}

function adicionarItem() {
  const tipo = document.getElementById("tipo").value;
  const motivo = document.getElementById("motivo").value;
  const quantidade = document.getElementById("quantidade").value;
  const observacao = document.getElementById("observacao").value;

  if (!tipo || !motivo || !quantidade || quantidade <= 0) {
    mostrarMensagem("Preencha tipo, motivo e quantidade.", "erro");
    return;
  }

  itens.push({
    tipo,
    motivo,
    quantidade,
    observacao
  });

  limparCampos();
  renderizarItens();

  mostrarMensagem("Refugo adicionado.", "sucesso");
}

function renderizarItens() {
  const lista = document.getElementById("listaItens");
  lista.innerHTML = "";

  if (itens.length === 0) {
    lista.innerHTML = "<p>Nenhum item registrado ainda.</p>";
    return;
  }

  itens.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <strong>${item.tipo}</strong><br>
      Motivo: ${item.motivo}<br>
      Quantidade: ${item.quantidade}<br>
      <small>${item.observacao || "Sem observação"}</small>
      <button onclick="removerItem(${index})">Remover</button>
    `;

    lista.appendChild(div);
  });
}

function removerItem(index) {
  itens.splice(index, 1);
  renderizarItens();
}

function limparCampos() {
  document.getElementById("tipo").value = "";
  document.getElementById("motivo").value = "";
  document.getElementById("quantidade").value = "";
  document.getElementById("observacao").value = "";
}

async function finalizarAfericao() {
  if (itens.length === 0) {
    mostrarMensagem("Adicione pelo menos um refugo antes de finalizar.", "erro");
    return;
  }

  horaFim = new Date();
  clearInterval(intervaloTimer);

  const dadosEnvio = {
    data: formatarData(horaInicio),
    horaInicio: formatarHora(horaInicio),
    horaFim: formatarHora(horaFim),
    tempoTotal: formatarTempo(horaFim - horaInicio),
    ajudante: document.getElementById("ajudante").value,
    itens: itens
  };

  try {
    mostrarMensagem("Enviando dados para a planilha...", "sucesso");

    const resposta = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(dadosEnvio)
    });

    const retorno = await resposta.json();

    if (retorno.status === "success") {
      mostrarMensagem("Aferição finalizada e salva com sucesso!", "sucesso");

      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      mostrarMensagem("Erro ao salvar: " + retorno.message, "erro");
    }

  } catch (erro) {
    mostrarMensagem("Erro ao enviar dados para a planilha.", "erro");
  }
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}

function formatarHora(data) {
  return data.toLocaleTimeString("pt-BR");
}

function formatarTempo(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  return (
    String(horas).padStart(2, "0") + ":" +
    String(minutos).padStart(2, "0") + ":" +
    String(segundos).padStart(2, "0")
  );
}

function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = texto;
  mensagem.className = tipo;
}
