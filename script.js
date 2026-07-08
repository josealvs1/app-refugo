const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxSWemrgsrkqfYa_8yEzqZySSYthA8q1s2rSOUQ1ISFiyWgffJKxJ9sJ5RHnFWdvZBI/exec";
let motivos = [];
let registros = [];

let horaInicioItem = null;
let intervaloTimerItem = null;

window.onload = function () {
  carregarDados();
};

async function carregarDados() {
  try {
    const resposta = await fetch(WEB_APP_URL);
    const dados = await resposta.json();

    motivos = dados.motivos || [];

    preencherSelect("ajudante", dados.ajudantes, "Selecione o ajudante");
    preencherSelect("tipo", dados.tipos, "Selecione o tipo");

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

function iniciarAfericaoGeral() {
  const ajudante = document.getElementById("ajudante").value;
  const mapa = document.getElementById("mapa").value;

  if (!ajudante) {
    mostrarMensagem("Selecione o ajudante.", "erro");
    return;
  }

  if (!mapa || mapa <= 0) {
    mostrarMensagem("Informe o número do mapa.", "erro");
    return;
  }

  document.getElementById("ajudante").disabled = true;
  document.getElementById("mapa").disabled = true;
  document.getElementById("btnIniciarGeral").disabled = true;

  document.getElementById("areaTipo").style.display = "block";
  document.getElementById("areaLista").style.display = "block";

  mostrarMensagem("Aferição geral iniciada.", "sucesso");
}

function iniciarVasilhame() {
  const tipo = document.getElementById("tipo").value;

  if (!tipo) {
    mostrarMensagem("Selecione o tipo de vasilhame.", "erro");
    return;
  }

  horaInicioItem = new Date();

  document.getElementById("tipo").disabled = true;
  document.getElementById("btnIniciarItem").disabled = true;

  document.getElementById("areaTimerItem").style.display = "block";
  document.getElementById("areaRegistro").style.display = "block";

  document.getElementById("horaInicioItemTexto").textContent =
    "Iniciado às " + formatarHora(horaInicioItem);

  montarCamposMotivos();

  intervaloTimerItem = setInterval(atualizarTimerItem, 1000);

  mostrarMensagem("Aferição do vasilhame iniciada.", "sucesso");
}

function atualizarTimerItem() {
  const agora = new Date();
  const diferenca = agora - horaInicioItem;
  document.getElementById("timerItem").textContent = formatarTempo(diferenca);
}

function montarCamposMotivos() {
  const container = document.getElementById("motivosContainer");
  container.innerHTML = "";

  motivos.forEach((motivo, index) => {
    const div = document.createElement("div");
    div.className = "motivo-linha";

    div.innerHTML = `
      <label for="motivo_${index}">${motivo}</label>
      <input type="number" id="motivo_${index}" min="0" value="0" />
    `;

    container.appendChild(div);
  });
}

async function finalizarVasilhame() {
  const quantidadeAferida = document.getElementById("quantidadeAferida").value;
  const observacao = document.getElementById("observacao").value;

  if (!quantidadeAferida || quantidadeAferida <= 0) {
    mostrarMensagem("Informe a quantidade aferida.", "erro");
    return;
  }

  let totalRefugado = 0;
  const motivosRegistrados = {};

  motivos.forEach((motivo, index) => {
    const valor = Number(document.getElementById(`motivo_${index}`).value || 0);
    motivosRegistrados[motivo] = valor;
    totalRefugado += valor;
  });

  if (totalRefugado > Number(quantidadeAferida)) {
    mostrarMensagem("O total refugado não pode ser maior que a quantidade aferida.", "erro");
    return;
  }

  const horaFimItem = new Date();
  clearInterval(intervaloTimerItem);

  const registro = {
    data: formatarData(horaInicioItem),
    ajudante: document.getElementById("ajudante").value,
    mapa: document.getElementById("mapa").value,
    tipo: document.getElementById("tipo").value,
    horaInicio: formatarHora(horaInicioItem),
    horaFim: formatarHora(horaFimItem),
    tempo: formatarTempo(horaFimItem - horaInicioItem),
    quantidadeAferida: quantidadeAferida,
    motivos: motivosRegistrados,
    observacao: observacao
  };

  try {
    mostrarMensagem("Salvando registro na planilha...", "sucesso");

    const resposta = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        registros: [registro]
      })
    });

    const retorno = await resposta.json();

    if (retorno.status === "success") {
      registros.push(registro);
      renderizarRegistros();
      limparItem();
      mostrarMensagem("Vasilhame salvo com sucesso!", "sucesso");
    } else {
      mostrarMensagem("Erro ao salvar: " + retorno.message, "erro");
    }

  } catch (erro) {
    mostrarMensagem("Erro ao enviar dados para a planilha.", "erro");
  }
}

function renderizarRegistros() {
  const lista = document.getElementById("listaItens");
  lista.innerHTML = "";

  if (registros.length === 0) {
    lista.innerHTML = "<p>Nenhum vasilhame registrado ainda.</p>";
    return;
  }

  registros.forEach(registro => {
    const div = document.createElement("div");
    div.className = "item";

    let motivosTexto = "";

    Object.keys(registro.motivos).forEach(motivo => {
      motivosTexto += `${motivo}: ${registro.motivos[motivo]}<br>`;
    });

    div.innerHTML = `
      <strong>${registro.tipo}</strong><br>
      Tempo: ${registro.tempo}<br>
      Quantidade Aferida: ${registro.quantidadeAferida}<br>
      ${motivosTexto}
      <small>${registro.observacao || "Sem observação"}</small>
    `;

    lista.appendChild(div);
  });
}

function limparItem() {
  document.getElementById("tipo").value = "";
  document.getElementById("tipo").disabled = false;
  document.getElementById("btnIniciarItem").disabled = false;

  document.getElementById("quantidadeAferida").value = "";
  document.getElementById("observacao").value = "";
  document.getElementById("motivosContainer").innerHTML = "";

  document.getElementById("timerItem").textContent = "00:00:00";

  document.getElementById("areaTimerItem").style.display = "none";
  document.getElementById("areaRegistro").style.display = "none";

  horaInicioItem = null;
}

function novaAfericao() {
  location.reload();
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
