// 5GNETT legacy logic adapted for the React shell.
// This file is loaded after App.jsx mounts the existing interface.
// The original logic is intentionally preserved to avoid changing the application's behavior.

// 5GNETT — CONTROLE DE ATENDIMENTOS | SCRIPT.JS

const STORAGE_KEY = "5gnett_atendimentos_v2";
const LEGACY_KEY = "5gnett_atendimentos_v1";

const SUPABASE_URL = "https://zgeenyqdbtxzkorfkmnq.supabase.co";
const SUPABASE_KEY = "sb_publishable_H2YIRxy8bVpA6UhUx2G2Yg_unN0ziVe";
const SUPABASE_TABLE = "atendimentos";

const SUPABASE_FOTOS_BUCKET = "fotos-equipe";
const FOTOS_EQUIPE = {
  Guilherme: "guilherme.png",
  Ronald: "ronald.jpg",
  Ivo: "ivo.jpg",
  Juarez: "juarez.jpg"
};

function urlFotoEquipe(nome) {
  const arquivo = FOTOS_EQUIPE[nome];
  if (!arquivo) return "";
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_FOTOS_BUCKET}/${arquivo}`;
}


let atendimentos = [];
let editandoId = null;
let bancoOnline = false;
let sessaoGerencia = null;
let gerenciaAutorizada = false;
const GERENCIA_UID = "f29980e0-5fbd-4d35-a374-945ed68e99fd";
const AUTH_STORAGE_KEY = "5gnett_gerencia_session";

const $ = id => document.getElementById(id);

const modal = $("modalAtendimento");
const modalRelato = $("modalRelato");
const form = $("formAtendimento");
const tabela = $("tabelaAtendimentos");

function salvarBackupLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(atendimentos));
}

function headersSupabase(prefer = "") {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${sessaoGerencia?.access_token || SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  if (prefer) headers["Prefer"] = prefer;
  return headers;
}

async function carregarAtendimentosOnline() {
  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&order=created_at.desc`,
    { headers: headersSupabase() }
  );

  if (!resposta.ok) {
    throw new Error(await resposta.text());
  }

  atendimentos = await resposta.json();
  bancoOnline = true;
  salvarBackupLocal();
  atualizarTela();
  atualizarRelatorios();
  atualizarBonificacao();
  atualizarPainelEquipe();
}

async function inserirAtendimentoOnline(registro) {
  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`,
    {
      method: "POST",
      headers: headersSupabase("return=representation"),
      body: JSON.stringify(registro)
    }
  );

  if (!resposta.ok) throw new Error(await resposta.text());
  const dados = await resposta.json();
  return dados[0];
}

async function atualizarAtendimentoOnline(id, registro) {
  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: headersSupabase("return=representation"),
      body: JSON.stringify(registro)
    }
  );

  if (!resposta.ok) throw new Error(await resposta.text());
  const dados = await resposta.json();
  return dados[0];
}

async function excluirAtendimentoOnline(id) {
  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: headersSupabase()
    }
  );

  if (!resposta.ok) throw new Error(await resposta.text());
}


function headersAuth(token = "") {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function abrirLoginGerencia() {
  $("erroLoginGerencia").hidden = true;
  $("erroLoginGerencia").textContent = "";
  $("modalLoginGerencia").classList.add("ativo");
  setTimeout(() => $("emailGerencia")?.focus(), 50);
}

function fecharLoginGerencia() {
  $("modalLoginGerencia").classList.remove("ativo");
  $("formLoginGerencia")?.reset();
  $("erroLoginGerencia").hidden = true;
}

function atualizarInterfaceGerencia() {
  document.body.classList.toggle("gerencia-logada", gerenciaAutorizada);

  if ($("btnLoginGerencia")) $("btnLoginGerencia").hidden = gerenciaAutorizada;
  if ($("btnSairGerencia")) $("btnSairGerencia").hidden = !gerenciaAutorizada;

  if ($("usuarioNome")) {
    $("usuarioNome").textContent = gerenciaAutorizada ? "Gerência 5GNETT" : "Equipe 5GNETT";
  }
  if ($("usuarioPerfil")) {
    $("usuarioPerfil").textContent = gerenciaAutorizada ? "Acesso administrativo" : "Suporte Técnico";
  }

  renderizarTabela();

  atualizarControlesFotoEquipe();
}

async function validarGerencia(token, userId) {
  if (!token || !userId || String(userId) !== GERENCIA_UID) return false;

  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/gerencia?user_id=eq.${encodeURIComponent(userId)}&select=user_id`,
    { headers: headersAuth(token) }
  );

  if (!resposta.ok) return false;
  const dados = await resposta.json();
  return Array.isArray(dados) && dados.some(item => String(item.user_id) === String(userId));
}

async function loginGerencia(email, senha) {
  const resposta = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: headersAuth(),
      body: JSON.stringify({ email, password: senha })
    }
  );

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados?.msg || dados?.error_description || "E-mail ou senha inválidos.");
  }

  const autorizado = await validarGerencia(dados.access_token, dados.user?.id);
  if (!autorizado) {
    throw new Error("Esta conta não possui acesso à Gerência.");
  }

  sessaoGerencia = dados;
  gerenciaAutorizada = true;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dados));
  atualizarInterfaceGerencia();
  return true;
}

async function restaurarSessaoGerencia() {
  try {
    const salva = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    if (!salva?.access_token || !salva?.user?.id) return;

    const resposta = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: headersAuth(salva.access_token)
    });

    if (!resposta.ok) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    const usuario = await resposta.json();
    const autorizado = await validarGerencia(salva.access_token, usuario.id);

    if (autorizado) {
      sessaoGerencia = salva;
      gerenciaAutorizada = true;
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  atualizarInterfaceGerencia();
}

async function sairGerencia() {
  const token = sessaoGerencia?.access_token;

  try {
    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: headersAuth(token)
      });
    }
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão no servidor:", erro);
  }

  sessaoGerencia = null;
  gerenciaAutorizada = false;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  atualizarInterfaceGerencia();
  mostrarPagina("inicio");
}

function exigirGerencia() {
  if (gerenciaAutorizada) return true;
  abrirLoginGerencia();
  return false;
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatarData(data) {
  if (!data) return "";
  const [a,m,d] = data.split("-");
  return `${d}/${m}/${a}`;
}

function escaparHTML(v = "") {
  return String(v)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function migrarDadosAntigos() {
  if (atendimentos.length) return;

  const antigos = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
  if (!Array.isArray(antigos) || !antigos.length) return;

  atendimentos = antigos.map(a => ({
    ...a,
    atendente: a.atendente || "Guilherme",
    canal: a.canal || "Chatmix",
    relato: a.relato || ""
  }));

  salvarBackupLocal();
}

function atualizarCamposCanal() {
  const canal = $("canal").value;
  const grupoLink = $("grupoLink");
  const grupoRelato = $("grupoRelato");
  const labelRelato = grupoRelato?.querySelector("label");
  const textareaRelato = $("relato");
  const ajudaRelato = grupoRelato?.querySelector("small");

  // O relato é obrigatório para os dois canais.
  if (canal === "Ligação") {
    grupoLink.style.display = "none";
    grupoRelato.classList.add("ativo");
    $("link").required = false;
    $("relato").required = true;

    if (labelRelato) labelRelato.textContent = "Relato da ligação *";
    if (textareaRelato) {
      textareaRelato.placeholder =
        "Descreva o que o cliente informou durante a chamada...";
    }
    if (ajudaRelato) {
      ajudaRelato.textContent =
        "Registre aqui as principais informações passadas pelo cliente durante a ligação.";
    }
  } else {
    grupoLink.style.display = "flex";
    grupoRelato.classList.add("ativo");
    $("link").required = true;
    $("relato").required = true;

    if (labelRelato) labelRelato.textContent = "Relato do atendimento *";
    if (textareaRelato) {
      textareaRelato.placeholder =
        "Descreva o que foi tratado com o cliente durante o atendimento no Chatmix...";
    }
    if (ajudaRelato) {
      ajudaRelato.textContent =
        "Registre aqui as principais informações tratadas com o cliente no Chatmix.";
    }
  }
}

function abrirModal(item = null) {
  modal.classList.add("ativo");

  if (item) {
    editandoId = item.id;
    $("data").value = item.data || hojeISO();
    $("atendente").value = item.atendente || "";
    $("codigo").value = item.codigo || "";
    $("cidade").value = item.cidade || "";
    $("nome").value = item.nome || "";
    $("canal").value = item.canal || "Chatmix";
    $("servico").value = item.servico || "";
    $("resolutividade").value = item.resolutividade || "Resolvido";
    $("link").value = item.link || "";
    $("relato").value = item.relato || "";
    modal.querySelector(".modal-header h2").textContent = "Editar Atendimento";
  } else {
    editandoId = null;
    form.reset();
    $("data").value = hojeISO();
    $("canal").value = "Chatmix";
    $("resolutividade").value = "Resolvido";
    modal.querySelector(".modal-header h2").textContent = "Novo Atendimento";
  }

  atualizarCamposCanal();
}

function fecharModal() {
  modal.classList.remove("ativo");
  editandoId = null;
  form.reset();
}

function obterFiltrados() {
  const pesquisa = $("pesquisa").value.trim().toLowerCase();
  const dataInicial = $("dataInicial").value;
  const dataFinal = $("dataFinal").value;
  const atendente = $("filtroAtendente").value;
  const canal = $("filtroCanal").value;
  const resolutividade = $("filtroResolutividade").value;

  return atendimentos.filter(item => {
    const texto = `${item.codigo} ${item.nome} ${item.cidade} ${item.atendente} ${item.servico} ${item.relato || ""}`.toLowerCase();

    if (pesquisa && !texto.includes(pesquisa)) return false;
    if (dataInicial && item.data < dataInicial) return false;
    if (dataFinal && item.data > dataFinal) return false;
    if (atendente && item.atendente !== atendente) return false;
    if (canal && item.canal !== canal) return false;
    if (resolutividade && item.resolutividade !== resolutividade) return false;

    return true;
  });
}

function atualizarCards() {
  const total = atendimentos.length;
  const resolvidos = atendimentos.filter(a => a.resolutividade === "Resolvido").length;
  const naoResolvidos = total - resolvidos;
  const taxa = total ? Math.round((resolvidos / total) * 100) : 0;

  $("totalAtendimentos").textContent = total;
  $("totalResolvidos").textContent = resolvidos;
  $("totalNaoResolvidos").textContent = naoResolvidos;
  $("taxaResolutividade").textContent = `${taxa}%`;
}


const REGRAS_PONTUACAO = { Simples: 3, Normal: 4, Complexo: 5, Excelente: 6 };
const REGRAS_PENALIZACAO = { "": 0, Leve: -2, Grave: -5 };

function pontosLiquidos(item) {
  return Number(item?.pontos || 0) + Number(item?.penalizacao || 0);
}

function rotuloPontuacao(item) {
  const classificacao = item?.classificacao || "Sem classificação";
  const erro = item?.tipo_erro ? ` • Erro ${String(item.tipo_erro).toLowerCase()}` : "";
  return `${classificacao} • ${pontosLiquidos(item)} pts${erro}`;
}

let avaliacaoAtual = {
  id: null,
  classificacao: "",
  pontos: 0,
  tipoErro: "",
  penalizacao: 0
};

function atualizarResumoAvaliacao() {
  const total = Number(avaliacaoAtual.pontos || 0) + Number(avaliacaoAtual.penalizacao || 0);
  if ($("avaliacaoPontuacaoFinal")) {
    $("avaliacaoPontuacaoFinal").textContent =
      avaliacaoAtual.classificacao ? `${total} pts` : "— pts";
  }

  document.querySelectorAll(".avaliacao-opcao").forEach(botao => {
    botao.classList.toggle(
      "ativa",
      botao.dataset.classificacao === avaliacaoAtual.classificacao
    );
  });

  document.querySelectorAll(".avaliacao-penalizacao").forEach(botao => {
    botao.classList.toggle(
      "ativa",
      (botao.dataset.erro || "") === avaliacaoAtual.tipoErro
    );
  });
}

function fecharAvaliacao() {
  $("modalAvaliacao")?.classList.remove("ativo");
  avaliacaoAtual = {
    id: null,
    classificacao: "",
    pontos: 0,
    tipoErro: "",
    penalizacao: 0
  };
}

function pontuarAtendimento(id) {
  if (!exigirGerencia()) return;

  const item = atendimentos.find(a => String(a.id) === String(id));
  if (!item || !$("modalAvaliacao")) return;

  avaliacaoAtual = {
    id: item.id,
    classificacao: item.classificacao || "",
    pontos: Number(item.pontos || 0),
    tipoErro: item.tipo_erro || "",
    penalizacao: Number(item.penalizacao || 0)
  };

  $("avaliacaoAtendimentoId").value = item.id;
  $("avaliacaoCliente").textContent = item.nome || "—";
  $("avaliacaoAtendente").textContent = item.atendente || "—";
  $("avaliacaoCodigo").textContent = item.codigo || "—";

  atualizarResumoAvaliacao();
  $("modalAvaliacao").classList.add("ativo");
}

async function salvarAvaliacaoAtendimento() {
  if (!exigirGerencia()) return;
  if (!avaliacaoAtual.id) return;

  if (!avaliacaoAtual.classificacao) {
    alert("Selecione a classificação do atendimento.");
    return;
  }

  const botao = $("salvarAvaliacao");
  if (botao) {
    botao.disabled = true;
    botao.textContent = "Salvando...";
  }

  const registro = {
    classificacao: avaliacaoAtual.classificacao,
    pontos: REGRAS_PONTUACAO[avaliacaoAtual.classificacao] || 0,
    penalizacao: REGRAS_PENALIZACAO[avaliacaoAtual.tipoErro] || 0,
    tipo_erro: avaliacaoAtual.tipoErro || null
  };

  try {
    const atualizado = await atualizarAtendimentoOnline(avaliacaoAtual.id, registro);
    atendimentos = atendimentos.map(a =>
      String(a.id) === String(avaliacaoAtual.id) ? atualizado : a
    );

    salvarBackupLocal();
    fecharAvaliacao();
    atualizarTela();
    atualizarRelatorios();
    atualizarBonificacao();
    atualizarPainelEquipe();
  } catch (erro) {
    console.error("Erro ao salvar avaliação:", erro);
    alert("Não foi possível salvar a avaliação no banco online.");
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Salvar avaliação";
    }
  }
}


function renderizarTabela() {
  const lista = obterFiltrados();

  $("contadorRegistros").textContent =
    `Total de ${lista.length} ${lista.length === 1 ? "registro" : "registros"}`;

  if (!lista.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="12" style="text-align:center;padding:36px;color:#91a4b7">
          Nenhum atendimento encontrado.
        </td>
      </tr>`;
    return;
  }

  tabela.innerHTML = lista.map((item, i) => {
    const resolvido = item.resolutividade === "Resolvido";
    const canal = item.canal || "Chatmix";

    let conversa = "";

    if (canal === "Ligação") {
      conversa = `
        <button class="btn-relato" type="button"
          onclick="verRelato('${item.id}')">📞 Ver relato</button>`;
    } else {
      const linkChatmix = item.link
        ? `<a class="link-chat"
             href="${escaparHTML(item.link)}"
             target="_blank"
             rel="noopener noreferrer">Abrir conversa ↗</a>`
        : `<span style="color:#71879a">Sem link</span>`;

      const relatoChatmix = item.relato
        ? `<button class="btn-relato" type="button"
             onclick="verRelato('${item.id}')">💬 Ver relato</button>`
        : "";

      conversa = `${linkChatmix}${relatoChatmix}`;
    }

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${formatarData(item.data)}</td>
        <td>${escaparHTML(item.codigo)}</td>
        <td>${escaparHTML(item.nome)}</td>
        <td><strong>${escaparHTML(item.atendente || "-")}</strong></td>
        <td>${escaparHTML(item.cidade)}</td>
        <td>
          <span class="${canal === "Ligação" ? "canal-ligacao" : "canal-chatmix"}">
            ${canal === "Ligação" ? "📞 Ligação" : "💬 Chatmix"}
          </span>
        </td>
        <td>${escaparHTML(item.servico)}</td>
        <td>
          <span class="${resolvido ? "status-resolvido" : "status-nao-resolvido"}">
            ${escaparHTML(item.resolutividade)}
          </span>
        </td>
        <td>
          ${gerenciaAutorizada
            ? `<button class="acao-pontuar" type="button" onclick="pontuarAtendimento('${item.id}')" title="Classificar pontuação">⭐ ${escaparHTML(rotuloPontuacao(item))}</button>`
            : `<span class="pontuacao-leitura">⭐ ${escaparHTML(rotuloPontuacao(item))}</span>`}
        </td>
        <td>${conversa}</td>
        <td>
          <button class="acao-editar" type="button"
            onclick="editarAtendimento('${item.id}')" title="Editar">✎</button>
          ${gerenciaAutorizada ? `<button class="acao-excluir" type="button"
            onclick="excluirAtendimento('${item.id}')" title="Excluir">×</button>` : ""}
        </td>
      </tr>`;
  }).join("");
}

function atualizarTela() {
  atualizarCards();
  renderizarTabela();
}

function editarAtendimento(id) {
  const item = atendimentos.find(a => String(a.id) === String(id));
  if (item) abrirModal(item);
}

async function excluirAtendimento(id) {
  if (!exigirGerencia()) return;

  const item = atendimentos.find(a => String(a.id) === String(id));
  if (!item) return;

  if (!confirm(`Deseja excluir o atendimento de ${item.nome}?`)) return;

  try {
    await excluirAtendimentoOnline(id);
    atendimentos = atendimentos.filter(a => String(a.id) !== String(id));
    salvarBackupLocal();
    atualizarTela();
    atualizarRelatorios();
    atualizarBonificacao();
    atualizarPainelEquipe();
  } catch (erro) {
    console.error("Erro ao excluir atendimento:", erro);
    alert("Não foi possível excluir o atendimento do banco online.");
  }
}

function verRelato(id) {
  const item = atendimentos.find(a => String(a.id) === String(id));
  if (!item) return;

  $("relatoIdentificacao").textContent =
    `${item.nome} • ${item.atendente} • ${formatarData(item.data)}`;

  const tituloRelato = $("modalRelato")?.querySelector(".modal-header h2");
  if (tituloRelato) {
    tituloRelato.textContent =
      item.canal === "Chatmix"
        ? "💬 Relato do Atendimento"
        : "📞 Relato da Ligação";
  }

  $("textoRelato").textContent = item.relato || "Nenhum relato registrado.";
  modalRelato.classList.add("ativo");
}

function fecharRelato() {
  modalRelato.classList.remove("ativo");
}

window.editarAtendimento = editarAtendimento;
window.excluirAtendimento = excluirAtendimento;
window.verRelato = verRelato;
window.pontuarAtendimento = pontuarAtendimento;

form.addEventListener("submit", async e => {
  e.preventDefault();

  const canal = $("canal").value;

  if (canal === "Chatmix" && !$("link").value.trim()) {
    alert("Informe o link da conversa no Chatmix.");
    $("link").focus();
    return;
  }

  if (!$("relato").value.trim()) {
    alert(
      canal === "Ligação"
        ? "Informe o que o cliente relatou durante a ligação."
        : "Informe o relato do atendimento realizado no Chatmix."
    );
    $("relato").focus();
    return;
  }

  const registro = {
    data: $("data").value,
    atendente: $("atendente").value,
    codigo: $("codigo").value.trim(),
    nome: $("nome").value.trim(),
    cidade: $("cidade").value.trim(),
    canal,
    servico: $("servico").value,
    resolutividade: $("resolutividade").value,
    link: canal === "Chatmix" ? $("link").value.trim() : "",
    relato: $("relato").value.trim()
  };

  try {
    if (editandoId !== null) {
      const atualizado = await atualizarAtendimentoOnline(editandoId, registro);
      atendimentos = atendimentos.map(a =>
        String(a.id) === String(editandoId) ? atualizado : a
      );
    } else {
      const novo = await inserirAtendimentoOnline(registro);
      atendimentos.unshift(novo);
    }

    salvarBackupLocal();
    fecharModal();
    atualizarTela();
    atualizarRelatorios();
    atualizarBonificacao();
    atualizarPainelEquipe();
  } catch (erro) {
    console.error("Erro ao salvar atendimento:", erro);
    alert("Não foi possível salvar o atendimento no banco online. Verifique a conexão e as políticas do Supabase.");
  }
});

$("canal").addEventListener("change", atualizarCamposCanal);
$("btnNovoAtendimento").addEventListener("click", () => abrirModal());
$("menuNovoAtendimento").addEventListener("click", () => abrirModal());
$("fecharModal").addEventListener("click", fecharModal);
$("cancelarModal").addEventListener("click", fecharModal);

$("fecharModalRelato").addEventListener("click", fecharRelato);
$("okRelato").addEventListener("click", fecharRelato);

document.querySelectorAll(".avaliacao-opcao").forEach(botao => {
  botao.addEventListener("click", () => {
    const classificacao = botao.dataset.classificacao || "";
    avaliacaoAtual.classificacao = classificacao;
    avaliacaoAtual.pontos = REGRAS_PONTUACAO[classificacao] || 0;
    atualizarResumoAvaliacao();
  });
});

document.querySelectorAll(".avaliacao-penalizacao").forEach(botao => {
  botao.addEventListener("click", () => {
    avaliacaoAtual.tipoErro = botao.dataset.erro || "";
    avaliacaoAtual.penalizacao = Number(botao.dataset.penalizacao || 0);
    atualizarResumoAvaliacao();
  });
});

if ($("fecharModalAvaliacao")) $("fecharModalAvaliacao").addEventListener("click", fecharAvaliacao);
if ($("cancelarAvaliacao")) $("cancelarAvaliacao").addEventListener("click", fecharAvaliacao);
if ($("salvarAvaliacao")) $("salvarAvaliacao").addEventListener("click", salvarAvaliacaoAtendimento);

if ($("modalAvaliacao")) {
  $("modalAvaliacao").addEventListener("click", e => {
    if (e.target === $("modalAvaliacao")) fecharAvaliacao();
  });
}


modal.addEventListener("click", e => {
  if (e.target === modal) fecharModal();
});

modalRelato.addEventListener("click", e => {
  if (e.target === modalRelato) fecharRelato();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (modal.classList.contains("ativo")) fecharModal();
    if (modalRelato.classList.contains("ativo")) fecharRelato();
    if ($("modalLoginGerencia")?.classList.contains("ativo")) fecharLoginGerencia();
    if ($("modalAvaliacao")?.classList.contains("ativo")) fecharAvaliacao();
    if ($("modalPreviaFechamento")?.classList.contains("ativo")) fecharPreviaFechamento();
    if ($("modalHistoricoFechamentos")?.classList.contains("ativo")) fecharHistoricoFechamentos();
  }
});

$("pesquisa").addEventListener("input", renderizarTabela);
$("btnFiltrar").addEventListener("click", renderizarTabela);

$("btnLimpar").addEventListener("click", () => {
  $("pesquisa").value = "";
  $("dataInicial").value = "";
  $("dataFinal").value = "";
  $("filtroAtendente").value = "";
  $("filtroCanal").value = "";
  $("filtroResolutividade").value = "";
  renderizarTabela();
});

function mostrarDataAtual() {
  $("dataAtual").textContent = new Date().toLocaleDateString("pt-BR", {
    weekday:"long", day:"2-digit", month:"long", year:"numeric"
  });
}


// =========================
// NAVEGAÇÃO DO PAINEL
// =========================
function marcarMenuAtivo(botao) {
  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
  });

  if (botao) botao.classList.add("active");
}

function mostrarPagina(nome) {
  const paginas = [
    $("paginaInicio"),
    $("paginaAtendimentos"),
    $("paginaEquipe"),
    $("paginaBonificacao"),
    $("paginaRelatorios"),
    $("paginaConfiguracoes")
  ].filter(Boolean);

  paginas.forEach(pagina => pagina.classList.remove("ativa"));

  if (nome === "atendimentos") {
    $("paginaAtendimentos").classList.add("ativa");
    marcarMenuAtivo($("menuAtendimentos"));
    renderizarTabela();
  } else if (nome === "equipe") {
    $("paginaEquipe")?.classList.add("ativa");
    marcarMenuAtivo($("menuEquipe"));
    atualizarPainelEquipe();
  } else if (nome === "bonificacao") {
    if (!exigirGerencia()) return;
    $("paginaBonificacao").classList.add("ativa");
    marcarMenuAtivo($("menuBonificacao"));
    atualizarBonificacao();
    atualizarStatusFechamentoMensal();
  } else if (nome === "relatorios") {
    if (!exigirGerencia()) return;
    $("paginaRelatorios").classList.add("ativa");
    marcarMenuAtivo($("menuRelatorios"));
    atualizarRelatorios();
  } else if (nome === "configuracoes") {
    if (!exigirGerencia()) return;
    $("paginaConfiguracoes").classList.add("ativa");
    marcarMenuAtivo($("menuConfiguracoes"));
  } else {
    $("paginaInicio").classList.add("ativa");
    marcarMenuAtivo($("menuInicio"));
    atualizarCards();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================
// FOTO DA EQUIPE — STORAGE
// =========================
function extensaoFotoEquipe(arquivo) {
  if (arquivo?.type === "image/png") return "png";
  if (arquivo?.type === "image/webp") return "webp";
  return "jpg";
}

function atualizarControlesFotoEquipe() {
  const acoes = $("equipeFotoAcoes");
  if (acoes) acoes.hidden = !gerenciaAutorizada;
}

async function enviarFotoEquipe(arquivo) {
  if (!gerenciaAutorizada || !sessaoGerencia?.access_token) {
    alert("Entre na Gerência para alterar a foto.");
    return;
  }
  if (!arquivo) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(arquivo.type)) {
    alert("Use uma imagem PNG, JPG/JPEG ou WEBP.");
    return;
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    alert("A foto deve ter no máximo 5 MB.");
    return;
  }

  const nome = atendentePerfilSelecionado;
  const base = nome.toLowerCase();
  const arquivoDestino = `${base}.${extensaoFotoEquipe(arquivo)}`;
  const status = $("statusFotoEquipe");
  const botao = $("btnAlterarFotoEquipe");

  if (status) status.textContent = "Enviando...";
  if (botao) botao.disabled = true;

  try {
    const resposta = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_FOTOS_BUCKET}/${arquivoDestino}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${sessaoGerencia.access_token}`,
          "Content-Type": arquivo.type,
          "x-upsert": "true"
        },
        body: arquivo
      }
    );

    if (!resposta.ok) throw new Error(await resposta.text());

    FOTOS_EQUIPE[nome] = arquivoDestino;
    const versao = Date.now();

    const foto = $("perfilEquipeFoto");
    if (foto) foto.src = `${urlFotoEquipe(nome)}?v=${versao}`;

    const card = document.querySelector(`[data-atendente-perfil="${nome}"] .equipe-avatar-v1`);
    if (card) {
      card.textContent = "";
      card.style.backgroundImage = `url("${urlFotoEquipe(nome)}?v=${versao}")`;
    }

    if (status) status.textContent = "Foto atualizada";
  } catch (erro) {
    console.error("Erro ao enviar foto:", erro);
    if (status) status.textContent = "";
    alert("Não foi possível alterar a foto.");
  } finally {
    if (botao) botao.disabled = false;
    const input = $("inputFotoEquipe");
    if (input) input.value = "";
  }
}

function configurarUploadFotoEquipe() {
  const botao = $("btnAlterarFotoEquipe");
  const input = $("inputFotoEquipe");

  botao?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", () => enviarFotoEquipe(input.files?.[0]));
  atualizarControlesFotoEquipe();
}


// =========================
// EQUIPE — PAINEL INDIVIDUAL
// =========================
let atendentePerfilSelecionado = "Guilherme";

function definirTexto(id, valor) {
  const elemento = $(id);
  if (elemento) elemento.textContent = valor;
}

function atualizarPainelEquipe(nome = atendentePerfilSelecionado) {
  if (!$("paginaEquipe")) return;

  const nomesValidos = ["Guilherme", "Ronald", "Ivo", "Juarez"];
  atendentePerfilSelecionado = nomesValidos.includes(nome) ? nome : "Guilherme";

  const itens = atendimentos.filter(
    item => String(item.atendente || "").trim() === atendentePerfilSelecionado
  );

  const total = itens.length;
  const resolvidos = itens.filter(item => item.resolutividade === "Resolvido").length;
  const taxa = total ? Math.round((resolvidos / total) * 100) : 0;

  const pontosBase = itens.reduce((soma, item) => soma + Number(item.pontos || 0), 0);
  const penalizacaoTotal = itens.reduce(
    (soma, item) => soma + Number(item.penalizacao || 0),
    0
  );
  const pontos = pontosBase + penalizacaoTotal;

  const classificados = itens.filter(item => item.classificacao).length;
  const media = classificados ? pontos / classificados : 0;

  const simples = itens.filter(item => item.classificacao === "Simples").length;
  const normal = itens.filter(item => item.classificacao === "Normal").length;
  const complexo = itens.filter(item => item.classificacao === "Complexo").length;
  const excelente = itens.filter(item => item.classificacao === "Excelente").length;
  const errosLeves = itens.filter(item => item.tipo_erro === "Leve").length;
  const errosGraves = itens.filter(item => item.tipo_erro === "Grave").length;
  const totalPenalizacoes = errosLeves + errosGraves;

  const progresso = Math.max(0, Math.min(100, (pontos / 350) * 100));

  definirTexto("perfilEquipeNome", atendentePerfilSelecionado);
  const inicial = atendentePerfilSelecionado.charAt(0).toUpperCase();
  definirTexto("perfilEquipeInicial", inicial);

  const fotoPerfil = $("perfilEquipeFoto");
  const inicialPerfil = $("perfilEquipeInicial");
  if (fotoPerfil) {
    fotoPerfil.onload = () => {
      fotoPerfil.hidden = false;
      fotoPerfil.style.display = "block";
      if (inicialPerfil) inicialPerfil.style.display = "none";
    };
    fotoPerfil.onerror = () => {
      fotoPerfil.hidden = true;
      fotoPerfil.style.display = "none";
      if (inicialPerfil) inicialPerfil.style.display = "";
    };
    fotoPerfil.hidden = true;
    fotoPerfil.style.display = "none";
    if (inicialPerfil) inicialPerfil.style.display = "";
    fotoPerfil.src = `${urlFotoEquipe(atendentePerfilSelecionado)}?v=1`;
  }

  document.querySelectorAll("[data-atendente-perfil]").forEach(botao => {
    const nomeCard = botao.dataset.atendentePerfil || "";
    const avatar = botao.querySelector(".equipe-avatar-v1");
    if (!avatar) return;

    const url = urlFotoEquipe(nomeCard);
    const img = new Image();

    img.onload = () => {
      avatar.textContent = "";
      avatar.style.backgroundImage = `url("${url}?v=1")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.style.backgroundRepeat = "no-repeat";
    };

    img.onerror = () => {
      avatar.style.backgroundImage = "";
      avatar.textContent = nomeCard.charAt(0).toUpperCase();
    };

    img.src = `${url}?v=1`;
  });
  definirTexto("perfilEquipePontosTopo", `${pontos} pts`);
  definirTexto("perfilEquipePontos", pontos);
  definirTexto("perfilEquipeTotal", total);
  definirTexto("perfilEquipeTaxa", `${taxa}%`);
  definirTexto("perfilEquipeMedia", media.toFixed(2).replace(".", ","));
  definirTexto("perfilEquipePenalizacoes", totalPenalizacoes);
  definirTexto("perfilEquipeSimples", simples);
  definirTexto("perfilEquipeNormal", normal);
  definirTexto("perfilEquipeComplexo", complexo);
  definirTexto("perfilEquipeExcelente", excelente);
  definirTexto("perfilEquipeErroLeve", errosLeves);
  definirTexto("perfilEquipeErroGrave", errosGraves);
  definirTexto("perfilEquipeProgressoTexto", `${pontos} / 350 pts`);

  const barra = $("perfilEquipeProgressoBarra");
  if (barra) barra.style.width = `${progresso}%`;

  const metaResumo = document.querySelector("#paginaEquipe .equipe-meta-v1 small");
  if (metaResumo) {
    if (pontos >= 350) {
      metaResumo.textContent = "Faixa superior atingida • +20%";
    } else if (pontos >= 250) {
      metaResumo.textContent = `${350 - pontos} pts para a faixa superior`;
    } else {
      metaResumo.textContent = `${250 - pontos} pts para atingir a meta`;
    }
  }

  document.querySelectorAll("[data-atendente-perfil]").forEach(botao => {
    botao.classList.toggle(
      "ativo",
      botao.dataset.atendentePerfil === atendentePerfilSelecionado
    );
  });
}

function configurarPainelEquipe() {
  document.querySelectorAll("[data-atendente-perfil]").forEach(botao => {
    botao.addEventListener("click", () => {
      atualizarPainelEquipe(botao.dataset.atendentePerfil || "Guilherme");
    });
  });
}


// =========================
// RELATÓRIOS
// =========================
function obterDadosRelatorio() {
  const inicial = $("relatorioDataInicial")?.value || "";
  const final = $("relatorioDataFinal")?.value || "";
  const atendente = $("relatorioAtendente")?.value || "";

  return atendimentos.filter(item => {
    if (inicial && item.data < inicial) return false;
    if (final && item.data > final) return false;
    if (atendente && item.atendente !== atendente) return false;
    return true;
  });
}

function atualizarRelatorios() {
  if (!$("paginaRelatorios")) return;

  const lista = obterDadosRelatorio();
  const total = lista.length;
  const resolvidos = lista.filter(a => a.resolutividade === "Resolvido").length;
  const naoResolvidos = total - resolvidos;
  const taxa = total ? Math.round((resolvidos / total) * 100) : 0;
  const chatmix = lista.filter(a => (a.canal || "Chatmix") === "Chatmix").length;
  const ligacoes = lista.filter(a => a.canal === "Ligação").length;

  $("relTotal").textContent = total;
  $("relResolvidos").textContent = resolvidos;
  $("relNaoResolvidos").textContent = naoResolvidos;
  $("relTaxa").textContent = `${taxa}%`;
  $("relChatmix").textContent = chatmix;
  $("relLigacoes").textContent = ligacoes;

  const nomes = ["Guilherme", "Ronald", "Ivo", "Juarez"];
  const filtroAtendente = $("relatorioAtendente").value;
  const nomesExibidos = filtroAtendente ? [filtroAtendente] : nomes;

  $("tabelaRelatorioAtendentes").innerHTML = nomesExibidos.map(nome => {
    const itens = lista.filter(a => a.atendente === nome);
    const qtd = itens.length;
    const ok = itens.filter(a => a.resolutividade === "Resolvido").length;
    const nao = qtd - ok;
    const chats = itens.filter(a => (a.canal || "Chatmix") === "Chatmix").length;
    const calls = itens.filter(a => a.canal === "Ligação").length;
    const percentual = qtd ? Math.round((ok / qtd) * 100) : 0;

    return `
      <tr>
        <td><strong>${escaparHTML(nome)}</strong></td>
        <td>${qtd}</td>
        <td>${ok}</td>
        <td>${nao}</td>
        <td>${chats}</td>
        <td>${calls}</td>
        <td><strong>${percentual}%</strong></td>
      </tr>
    `;
  }).join("");
}


function obterDadosBonificacao() {
  const inicial = $("bonificacaoDataInicial")?.value || "";
  const final = $("bonificacaoDataFinal")?.value || "";

  return atendimentos.filter(item => {
    if (inicial && item.data < inicial) return false;
    if (final && item.data > final) return false;
    return true;
  });
}

function atualizarBonificacao() {
  if (!$("paginaBonificacao")) return;

  const lista = obterDadosBonificacao();
  const total = lista.length;
  const resolvidos = lista.filter(a => a.resolutividade === "Resolvido").length;
  const taxaEquipe = total ? Math.round((resolvidos / total) * 100) : 0;

  if ($("bonifTotal")) $("bonifTotal").textContent = total;
  if ($("bonifResolvidos")) $("bonifResolvidos").textContent = resolvidos;
  if ($("bonifTaxaEquipe")) $("bonifTaxaEquipe").textContent = `${taxaEquipe}%`;

  const nomes = ["Guilherme", "Ronald", "Ivo", "Juarez"];
  const ranking = nomes.map(nome => {
    const itens = lista.filter(a => a.atendente === nome);
    const qtd = itens.length;
    const ok = itens.filter(a => a.resolutividade === "Resolvido").length;
    const percentual = qtd ? Math.round((ok / qtd) * 100) : 0;
    const pontosBase = itens.reduce((s,a) => s + Number(a.pontos || 0), 0);
    const penalizacoes = itens.reduce((s,a) => s + Number(a.penalizacao || 0), 0);
    const pontos = pontosBase + penalizacoes;
    const classificados = itens.filter(a => a.classificacao).length;
    const media = classificados ? pontos / classificados : 0;
    return { nome, qtd, ok, percentual, pontos, penalizacoes, classificados, media };
  }).sort((a,b) =>
    b.pontos-a.pontos || b.media-a.media || b.percentual-a.percentual ||
    b.ok-a.ok || b.qtd-a.qtd || a.nome.localeCompare(b.nome)
  );

  const rankingEl = $("rankingBonificacao");
  if (rankingEl) {
    rankingEl.innerHTML = ranking.map((item, indice) => {
      const medalha = indice===0 ? "🥇" : indice===1 ? "🥈" : indice===2 ? "🥉" : "🏅";
      const faixa = item.pontos >= 350 ? "Faixa superior • +20%" :
                    item.pontos >= 250 ? "Meta atingida" :
                    `${Math.max(0,250-item.pontos)} pts para a meta`;
      return `
        <article class="ranking-card">
          <div class="ranking-posicao">${indice+1}º</div>
          <div class="ranking-medalha">${medalha}</div>
          <h4>${escaparHTML(item.nome)}</h4>
          <strong>${item.pontos} pts</strong>
          <span>${item.qtd} atendimentos • média ${item.media.toFixed(2).replace(".",",")} pts • ${item.percentual}% resolutividade</span>
          <span>${faixa}${item.penalizacoes ? ` • penalizações ${item.penalizacoes} pts` : ""}</span>
        </article>`;
    }).join("");
  }

  const lider = ranking.find(item => item.qtd > 0);
  if (lider) {
    if ($("bonifLiderNome")) $("bonifLiderNome").textContent = lider.nome;
    if ($("bonifLiderTaxa")) $("bonifLiderTaxa").textContent = `${lider.pontos} pts`;
    if ($("bonifLiderResumo")) $("bonifLiderResumo").textContent =
      `${lider.qtd} atendimentos • média ${lider.media.toFixed(2).replace(".",",")} pts • ${lider.percentual}% de resolutividade.`;
  } else {
    if ($("bonifLiderNome")) $("bonifLiderNome").textContent = "Nenhum atendimento";
    if ($("bonifLiderTaxa")) $("bonifLiderTaxa").textContent = "0 pts";
    if ($("bonifLiderResumo")) $("bonifLiderResumo").textContent =
      "Cadastre e classifique atendimentos para gerar o ranking da equipe.";
  }
}


// =========================
// FECHAMENTO MENSAL DA BONIFICAÇÃO
// =========================
const SUPABASE_FECHAMENTOS_TABLE = "fechamentos_mensais";
const ATENDENTES_BONIFICACAO = ["Guilherme", "Ronald", "Ivo", "Juarez"];

function competenciaAtual() {
  const agora = new Date();
  return {
    ano: agora.getFullYear(),
    mes: agora.getMonth() + 1,
    competencia: agora.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    }).toUpperCase()
  };
}

function intervaloCompetencia(ano, mes) {
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  const fimExclusivo = `${proximoAno}-${String(proximoMes).padStart(2, "0")}-01`;
  return { inicio, fimExclusivo };
}


function dataLiberacaoFechamento(ano, mes) {
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  return new Date(proximoAno, proximoMes - 1, 1, 0, 0, 0, 0);
}

function competenciaEncerrada(ano, mes) {
  return new Date() >= dataLiberacaoFechamento(ano, mes);
}

function formatarDataLiberacaoFechamento(ano, mes) {
  return dataLiberacaoFechamento(ano, mes).toLocaleDateString("pt-BR");
}

function atendimentosDaCompetencia(ano, mes) {
  const { inicio, fimExclusivo } = intervaloCompetencia(ano, mes);
  return atendimentos.filter(item =>
    item.data && item.data >= inicio && item.data < fimExclusivo
  );
}

function montarFechamentoAtendente(nome, ano, mes, competencia, listaMes) {
  const itens = listaMes.filter(item => item.atendente === nome);
  const total = itens.length;
  const resolvidos = itens.filter(item => item.resolutividade === "Resolvido").length;
  const naoResolvidos = total - resolvidos;
  const resolutividade = total ? Number(((resolvidos / total) * 100).toFixed(2)) : 0;

  const pontosBrutos = itens.reduce((soma, item) => soma + Number(item.pontos || 0), 0);
  const penalizacoes = itens.reduce((soma, item) => soma + Number(item.penalizacao || 0), 0);
  const pontosLiquidosTotal = pontosBrutos + penalizacoes;

  const simples = itens.filter(item => item.classificacao === "Simples").length;
  const normal = itens.filter(item => item.classificacao === "Normal").length;
  const complexo = itens.filter(item => item.classificacao === "Complexo").length;
  const excelente = itens.filter(item => item.classificacao === "Excelente").length;
  const errosLeves = itens.filter(item => item.tipo_erro === "Leve").length;
  const errosGraves = itens.filter(item => item.tipo_erro === "Grave").length;

  return {
    competencia,
    ano,
    mes,
    atendente: nome,
    total_atendimentos: total,
    resolvidos,
    nao_resolvidos: naoResolvidos,
    resolutividade,
    pontos_brutos: pontosBrutos,
    penalizacoes,
    pontos_liquidos: pontosLiquidosTotal,
    simples,
    normal,
    complexo,
    excelente,
    erros_leves: errosLeves,
    erros_graves: errosGraves,
    meta_individual: 250,
    faixa_superior: 350,
    meta_atingida: pontosLiquidosTotal >= 250,
    faixa_superior_atingida: pontosLiquidosTotal >= 350
  };
}

async function consultarFechamentosCompetencia(ano, mes) {
  if (!gerenciaAutorizada || !sessaoGerencia?.access_token) return [];

  const resposta = await fetch(
    `${SUPABASE_URL}/rest/v1/${SUPABASE_FECHAMENTOS_TABLE}?ano=eq.${ano}&mes=eq.${mes}&select=*&order=atendente.asc`,
    { headers: headersSupabase() }
  );

  if (!resposta.ok) throw new Error(await resposta.text());
  return await resposta.json();
}

async function atualizarStatusFechamentoMensal() {
  const competenciaEl = $("fechamentoCompetencia");
  const statusEl = $("fechamentoStatus");
  const botao = $("btnFecharMes");
  if (!competenciaEl || !statusEl || !botao) return;

  const { ano, mes, competencia } = competenciaAtual();
  competenciaEl.textContent = competencia;

  if (!gerenciaAutorizada) {
    statusEl.querySelector("strong").textContent = "ABERTO";
    botao.disabled = false;
    return;
  }

  try {
    const registros = await consultarFechamentosCompetencia(ano, mes);
    const fechado = ATENDENTES_BONIFICACAO.every(nome =>
      registros.some(item => item.atendente === nome)
    );

    const encerrada = competenciaEncerrada(ano, mes);
    statusEl.querySelector("strong").textContent = fechado ? "FECHADO" : "ABERTO";
    statusEl.classList.toggle("fechado", fechado);
    botao.disabled = fechado;
    botao.textContent = fechado
      ? "Mês fechado"
      : encerrada
        ? "Fechar mês"
        : "Ver prévia";
  } catch (erro) {
    console.error("Erro ao consultar fechamento mensal:", erro);
    statusEl.querySelector("strong").textContent = "ERRO";
    botao.disabled = false;
  }
}

let previaFechamentoAtual = null;

function fecharPreviaFechamento() {
  $("modalPreviaFechamento")?.classList.remove("ativo");
  previaFechamentoAtual = null;
}

function renderizarPreviaFechamento(resumo, competencia) {
  const tabelaPrevia = $("previaFechamentoTabela");
  if (!tabelaPrevia || !$("modalPreviaFechamento")) {
    alert("O modal de prévia não foi encontrado. Verifique se o App.jsx da etapa anterior está publicado.");
    return false;
  }

  definirTexto("previaFechamentoCompetencia", competencia);

  const referencia = resumo?.[0];
  const confirmar = $("confirmarFechamentoMensal");
  if (referencia && confirmar) {
    const liberado = competenciaEncerrada(Number(referencia.ano), Number(referencia.mes));
    confirmar.disabled = !liberado;
    confirmar.textContent = liberado
      ? "Confirmar fechamento"
      : `Disponível em ${formatarDataLiberacaoFechamento(Number(referencia.ano), Number(referencia.mes))}`;
    confirmar.title = liberado
      ? ""
      : `O fechamento definitivo será liberado em ${formatarDataLiberacaoFechamento(Number(referencia.ano), Number(referencia.mes))}.`;
  }

  tabelaPrevia.innerHTML = resumo.map(item => {
    const penalizacao = Number(item.penalizacoes || 0);
    const meta250 = item.meta_atingida ? "✓ Atingida" : `${Math.max(0, 250 - item.pontos_liquidos)} pts faltam`;
    const meta350 = item.faixa_superior_atingida ? "✓ Atingida" : `${Math.max(0, 350 - item.pontos_liquidos)} pts faltam`;

    return `
      <tr>
        <td><strong>${escaparHTML(item.atendente)}</strong></td>
        <td>${item.total_atendimentos}</td>
        <td>${Number(item.resolutividade || 0).toFixed(0)}%</td>
        <td>${item.pontos_brutos} pts</td>
        <td>${penalizacao} pts</td>
        <td><strong>${item.pontos_liquidos} pts</strong></td>
        <td>${meta250}</td>
        <td>${meta350}</td>
      </tr>
    `;
  }).join("");

  $("modalPreviaFechamento").classList.add("ativo");
  return true;
}

async function fecharMesBonificacao() {
  if (!exigirGerencia()) return;

  const { ano, mes, competencia } = competenciaAtual();
  const listaMes = atendimentosDaCompetencia(ano, mes);

  if (!listaMes.length) {
    alert(`Não existem atendimentos em ${competencia} para fechar.`);
    return;
  }

  try {
    const existentes = await consultarFechamentosCompetencia(ano, mes);
    if (existentes.length) {
      alert(`${competencia} já possui registros de fechamento. O sistema não criará um fechamento duplicado.`);
      await atualizarStatusFechamentoMensal();
      return;
    }
  } catch (erro) {
    console.error("Erro ao validar fechamento existente:", erro);
    alert("Não foi possível validar o histórico antes do fechamento.");
    return;
  }

  const semClassificacao = listaMes.filter(item => !item.classificacao);
  if (semClassificacao.length) {
    alert(
      `Ainda existem ${semClassificacao.length} atendimento(s) sem classificação em ${competencia}. ` +
      `Classifique todos antes de fechar o mês.`
    );
    return;
  }

  const resumo = ATENDENTES_BONIFICACAO.map(nome =>
    montarFechamentoAtendente(nome, ano, mes, competencia, listaMes)
  );

  previaFechamentoAtual = { ano, mes, competencia, resumo };
  renderizarPreviaFechamento(resumo, competencia);
}

async function confirmarFechamentoMensal() {
  if (!exigirGerencia() || !previaFechamentoAtual) return;

  const { ano, mes, competencia, resumo } = previaFechamentoAtual;
  const botao = $("confirmarFechamentoMensal");

  if (!competenciaEncerrada(ano, mes)) {
    alert(
      `${competencia} ainda está em andamento. ` +
      `O fechamento definitivo será liberado em ${formatarDataLiberacaoFechamento(ano, mes)}.`
    );
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = "Fechando...";
  }

  try {
    // Revalida imediatamente antes da gravação para impedir duplicidade.
    const existentes = await consultarFechamentosCompetencia(ano, mes);
    if (existentes.length) {
      fecharPreviaFechamento();
      await atualizarStatusFechamentoMensal();
      alert(`${competencia} já foi fechado.`);
      return;
    }

    const resposta = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_FECHAMENTOS_TABLE}`,
      {
        method: "POST",
        headers: headersSupabase("return=representation"),
        body: JSON.stringify(resumo)
      }
    );

    if (!resposta.ok) throw new Error(await resposta.text());

    fecharPreviaFechamento();
    await atualizarStatusFechamentoMensal();
    alert(`${competencia} foi fechado com sucesso.`);
  } catch (erro) {
    console.error("Erro ao fechar competência:", erro);
    alert("Não foi possível realizar o fechamento mensal no banco online.");
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Confirmar fechamento";
    }
  }
}

function fecharHistoricoFechamentos() {
  $("modalHistoricoFechamentos")?.classList.remove("ativo");
}

function rotuloMetaHistorico(pontos, meta) {
  const valor = Number(pontos || 0);
  if (valor >= meta) return `<strong class="historico-meta-atingida-v1">✓ Atingida</strong>`;
  return `${Math.max(0, meta - valor)} pts faltam`;
}

function renderizarHistoricoFechamentos(dados) {
  const modalHistorico = $("modalHistoricoFechamentos");
  const lista = $("historicoFechamentosLista");
  if (!modalHistorico || !lista) {
    alert("O modal de histórico não foi encontrado. Verifique se o App.jsx da etapa anterior está publicado.");
    return;
  }

  const grupos = new Map();

  dados.forEach(item => {
    const chave = `${item.ano}-${String(item.mes).padStart(2, "0")}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        ano: Number(item.ano),
        mes: Number(item.mes),
        competencia: item.competencia || chave,
        registros: []
      });
    }
    grupos.get(chave).registros.push(item);
  });

  const competencias = [...grupos.values()].sort(
    (a, b) => b.ano - a.ano || b.mes - a.mes
  );

  definirTexto("historicoTotalCompetencias", competencias.length);
  definirTexto(
    "historicoUltimoFechamento",
    competencias.length ? competencias[0].competencia : "—"
  );

  if (!competencias.length) {
    lista.innerHTML = `
      <div class="historico-vazio-v1">
        <strong>Nenhum fechamento registrado</strong>
        <span>As competências encerradas aparecerão aqui automaticamente.</span>
      </div>
    `;
    modalHistorico.classList.add("ativo");
    return;
  }

  lista.innerHTML = competencias.map((grupo, indice) => {
    const porNome = new Map(
      grupo.registros.map(item => [String(item.atendente || ""), item])
    );

    const registrosOrdenados = ATENDENTES_BONIFICACAO
      .map(nome => porNome.get(nome))
      .filter(Boolean);

    const totalAtendimentos = registrosOrdenados.reduce(
      (soma, item) => soma + Number(item.total_atendimentos || 0), 0
    );
    const totalPontos = registrosOrdenados.reduce(
      (soma, item) => soma + Number(item.pontos_liquidos || 0), 0
    );

    return `
      <article class="historico-competencia-v1 ${indice === 0 ? "mais-recente" : ""}">
        <div class="historico-competencia-topo-v1">
          <div>
            <span class="page-eyebrow">COMPETÊNCIA</span>
            <h3>${escaparHTML(grupo.competencia)}</h3>
          </div>

          <div class="historico-competencia-indicadores-v1">
            <span><strong>${totalAtendimentos}</strong> atendimentos</span>
            <span><strong>${totalPontos} pts</strong> somados</span>
            <span class="historico-fechado-badge-v1">FECHADO</span>
          </div>
        </div>

        <div class="historico-tabela-wrap-v1">
          <table class="historico-tabela-v1">
            <thead>
              <tr>
                <th>Atendente</th>
                <th>Atendimentos</th>
                <th>Resolutividade</th>
                <th>Pontos brutos</th>
                <th>Penalizações</th>
                <th>Pontos líquidos</th>
                <th>250 pts</th>
                <th>350 pts</th>
              </tr>
            </thead>
            <tbody>
              ${registrosOrdenados.map(item => `
                <tr>
                  <td><strong>${escaparHTML(item.atendente)}</strong></td>
                  <td>${Number(item.total_atendimentos || 0)}</td>
                  <td>${Number(item.resolutividade || 0).toFixed(0)}%</td>
                  <td>${Number(item.pontos_brutos || 0)} pts</td>
                  <td>${Number(item.penalizacoes || 0)} pts</td>
                  <td><strong class="historico-pontos-liquidos-v1">${Number(item.pontos_liquidos || 0)} pts</strong></td>
                  <td>${rotuloMetaHistorico(item.pontos_liquidos, 250)}</td>
                  <td>${rotuloMetaHistorico(item.pontos_liquidos, 350)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }).join("");

  modalHistorico.classList.add("ativo");
}

async function abrirHistoricoFechamentos() {
  if (!exigirGerencia()) return;

  const lista = $("historicoFechamentosLista");
  const modalHistorico = $("modalHistoricoFechamentos");

  if (!modalHistorico || !lista) {
    alert("O modal de histórico não foi encontrado. Verifique se o App.jsx da etapa anterior está publicado.");
    return;
  }

  definirTexto("historicoTotalCompetencias", "—");
  definirTexto("historicoUltimoFechamento", "Carregando...");
  lista.innerHTML = `
    <div class="historico-vazio-v1">
      <strong>Carregando histórico...</strong>
      <span>Consultando os fechamentos preservados no banco de dados.</span>
    </div>
  `;
  modalHistorico.classList.add("ativo");

  try {
    const resposta = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_FECHAMENTOS_TABLE}?select=*&order=ano.desc,mes.desc,atendente.asc`,
      { headers: headersSupabase() }
    );

    if (!resposta.ok) throw new Error(await resposta.text());

    const dados = await resposta.json();
    renderizarHistoricoFechamentos(Array.isArray(dados) ? dados : []);
  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
    definirTexto("historicoTotalCompetencias", "—");
    definirTexto("historicoUltimoFechamento", "Erro");
    lista.innerHTML = `
      <div class="historico-vazio-v1">
        <strong>Não foi possível carregar o histórico</strong>
        <span>Verifique a conexão e as permissões da tabela de fechamentos.</span>
      </div>
    `;
  }
}

if ($("btnFecharMes")) {
  $("btnFecharMes").addEventListener("click", fecharMesBonificacao);
}

if ($("fecharPreviaFechamento")) {
  $("fecharPreviaFechamento").addEventListener("click", fecharPreviaFechamento);
}

if ($("cancelarPreviaFechamento")) {
  $("cancelarPreviaFechamento").addEventListener("click", fecharPreviaFechamento);
}

if ($("confirmarFechamentoMensal")) {
  $("confirmarFechamentoMensal").addEventListener("click", confirmarFechamentoMensal);
}

if ($("modalPreviaFechamento")) {
  $("modalPreviaFechamento").addEventListener("click", e => {
    if (e.target === $("modalPreviaFechamento")) fecharPreviaFechamento();
  });
}

if ($("btnHistoricoFechamentos")) {
  $("btnHistoricoFechamentos").addEventListener("click", abrirHistoricoFechamentos);
}


if ($("fecharHistoricoFechamentos")) {
  $("fecharHistoricoFechamentos").addEventListener("click", fecharHistoricoFechamentos);
}

if ($("okHistoricoFechamentos")) {
  $("okHistoricoFechamentos").addEventListener("click", fecharHistoricoFechamentos);
}

if ($("modalHistoricoFechamentos")) {
  $("modalHistoricoFechamentos").addEventListener("click", e => {
    if (e.target === $("modalHistoricoFechamentos")) fecharHistoricoFechamentos();
  });
}


const menuInicio = $("menuInicio");
const menuAtendimentos = $("menuAtendimentos");
const menuEquipe = $("menuEquipe");
const menuRelatorios = $("menuRelatorios");
const menuConfiguracoes = $("menuConfiguracoes");
const menuBonificacao = $("menuBonificacao");
const btnNovoAtendimentoTopo = $("btnNovoAtendimentoTopo");

if (menuInicio) {
  menuInicio.addEventListener("click", () => mostrarPagina("inicio"));
}

if (menuAtendimentos) {
  menuAtendimentos.addEventListener("click", () => mostrarPagina("atendimentos"));
}

if (menuEquipe) {
  menuEquipe.addEventListener("click", () => mostrarPagina("equipe"));
}

if (menuRelatorios) {
  menuRelatorios.addEventListener("click", () => mostrarPagina("relatorios"));
}

if (menuBonificacao) {
  menuBonificacao.addEventListener("click", () => mostrarPagina("bonificacao"));
}

if (menuConfiguracoes) {
  menuConfiguracoes.addEventListener("click", () => mostrarPagina("configuracoes"));
}

if (btnNovoAtendimentoTopo) {
  btnNovoAtendimentoTopo.addEventListener("click", () => abrirModal());
}

if ($("btnFiltrarRelatorio")) {
  $("btnFiltrarRelatorio").addEventListener("click", atualizarRelatorios);
}

if ($("btnLimparRelatorio")) {
  $("btnLimparRelatorio").addEventListener("click", () => {
    $("relatorioDataInicial").value = "";
    $("relatorioDataFinal").value = "";
    $("relatorioAtendente").value = "";
    atualizarRelatorios();
  });
}


if ($("btnFiltrarBonificacao")) {
  $("btnFiltrarBonificacao").addEventListener("click", atualizarBonificacao);
}

if ($("btnLimparBonificacao")) {
  $("btnLimparBonificacao").addEventListener("click", () => {
    $("bonificacaoDataInicial").value = "";
    $("bonificacaoDataFinal").value = "";
    atualizarBonificacao();
  });
}


if ($("btnLoginGerencia")) $("btnLoginGerencia").addEventListener("click", abrirLoginGerencia);
if ($("fecharLoginGerencia")) $("fecharLoginGerencia").addEventListener("click", fecharLoginGerencia);
if ($("cancelarLoginGerencia")) $("cancelarLoginGerencia").addEventListener("click", fecharLoginGerencia);
if ($("btnSairGerencia")) $("btnSairGerencia").addEventListener("click", sairGerencia);

if ($("modalLoginGerencia")) {
  $("modalLoginGerencia").addEventListener("click", e => {
    if (e.target === $("modalLoginGerencia")) fecharLoginGerencia();
  });
}

if ($("formLoginGerencia")) {
  $("formLoginGerencia").addEventListener("submit", async e => {
    e.preventDefault();

    const email = $("emailGerencia").value.trim();
    const senha = $("senhaGerencia").value;
    const erro = $("erroLoginGerencia");
    const botao = e.submitter;

    erro.hidden = true;
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Entrando...";
    }

    try {
      await loginGerencia(email, senha);
      fecharLoginGerencia();
    } catch (falha) {
      console.error("Falha no login da Gerência:", falha);
      erro.textContent = falha.message || "Não foi possível entrar na Gerência.";
      erro.hidden = false;
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.textContent = "Entrar na Gerência";
      }
    }
  });
}

async function iniciarSistema() {
  mostrarDataAtual();
  configurarPainelEquipe();
  configurarUploadFotoEquipe();
  await restaurarSessaoGerencia();

  try {
    await carregarAtendimentosOnline();
    await atualizarStatusFechamentoMensal();
    console.log("5GNETT: banco online conectado.");
  } catch (erro) {
    console.error("5GNETT: falha ao carregar Supabase.", erro);

    const backup = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    atendimentos = Array.isArray(backup) ? backup : [];

    atualizarTela();
    atualizarRelatorios();
    atualizarBonificacao();
    atualizarPainelEquipe();

    alert("Não foi possível conectar ao banco online. O sistema exibirá o backup local deste navegador.");
  }
}

iniciarSistema();
                                
