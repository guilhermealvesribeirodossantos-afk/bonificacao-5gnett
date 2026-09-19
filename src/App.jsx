import { useEffect, useRef, useState } from "react";
import "./style.css";
import { initializeLegacyApp } from "./legacyLoader";
import logo from "./assets/logo 5gnett.png";
import perfil from "./assets/perfil.png";

export default function App() {
  const [servicoAberto, setServicoAberto] = useState(false);
  const [servicoBusca, setServicoBusca] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [servicoMenuPosicao, setServicoMenuPosicao] = useState({
    top: 0,
    left: 0,
    width: 320,
    maxHeight: 315,
  });
  const servicoComboboxRef = useRef(null);

  const gruposServico = [
    {
      titulo: "SUPORTE FIBRA",
      opcoes: ["Suporte Fibra", "Sem Acesso Fibra", "Lentidão Fibra", "Rompimento de Fibra", "Urgente Fibra"],
    },
    {
      titulo: "SUPORTE RÁDIO / RURAL",
      opcoes: ["Suporte Rural", "Sem Acesso Rádio", "Lentidão Rádio", "Urgente Rádio", "Sinal Alto"],
    },
    {
      titulo: "MANUTENÇÃO / REDE",
      opcoes: ["Manutenção Caixa", "Manutenção de Rede", "Manutenção Torre Rádio"],
    },
    {
      titulo: "SUPORTE INTERNO",
      opcoes: ["Suporte Tec Interno - Análise"],
    },
    {
      titulo: "OUTROS SUPORTES",
      opcoes: ["Suporte técnico", "Sem conexão", "Lentidão", "Configuração", "Outros"],
    },
  ];

  const normalizarBuscaServico = (valor) =>
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const gruposServicoFiltrados = gruposServico
    .map((grupo) => ({
      ...grupo,
      opcoes: grupo.opcoes.filter((opcao) =>
        normalizarBuscaServico(opcao).includes(normalizarBuscaServico(servicoBusca))
      ),
    }))
    .filter((grupo) => grupo.opcoes.length > 0);

  const ajustarPosicaoServico = () => {
    const elemento = servicoComboboxRef.current;
    if (!elemento) return;

    const rect = elemento.getBoundingClientRect();
    const margem = 16;
    const gap = 7;
    const alturaBuscaAproximada = 60;
    const alturaIdealLista = 315;
    const espacoAbaixo = window.innerHeight - rect.bottom - margem - gap;
    const espacoAcima = rect.top - margem - gap;

    const abrirParaCima =
      espacoAbaixo < 260 && espacoAcima > espacoAbaixo;

    const espacoDisponivel = abrirParaCima ? espacoAcima : espacoAbaixo;
    const maxHeight = Math.max(
      150,
      Math.min(alturaIdealLista, espacoDisponivel - alturaBuscaAproximada)
    );

    const alturaMenuEstimada = maxHeight + alturaBuscaAproximada;
    const top = abrirParaCima
      ? Math.max(margem, rect.top - gap - alturaMenuEstimada)
      : Math.min(window.innerHeight - margem - alturaMenuEstimada, rect.bottom + gap);

    setServicoMenuPosicao({
      top,
      left: Math.max(margem, Math.min(rect.left, window.innerWidth - rect.width - margem)),
      width: rect.width,
      maxHeight,
    });
  };

  const alternarServico = () => {
    if (!servicoAberto) {
      ajustarPosicaoServico();
    }
    setServicoAberto((aberto) => !aberto);
  };

  const selecionarServico = (servico) => {
    setServicoSelecionado(servico);
    setServicoBusca("");
    setServicoAberto(false);

    requestAnimationFrame(() => {
      const select = document.getElementById("servico");
      if (select) {
        select.value = servico;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  };

  useEffect(() => {
    if (!servicoAberto) return undefined;

    const reposicionar = () => ajustarPosicaoServico();

    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);

    return () => {
      window.removeEventListener("resize", reposicionar);
      window.removeEventListener("scroll", reposicionar, true);
    };
  }, [servicoAberto]);

  useEffect(() => {
    // =====================================================
    // TEMA CLARO / ESCURO
    // =====================================================

    const btnTema = document.getElementById("btnTema");

    const aplicarTema = (tema) => {
      const claro = tema === "claro";
      document.body.classList.toggle("tema-claro", claro);

      if (btnTema) {
        btnTema.textContent = claro ? "🌙" : "☀️";
        btnTema.title = claro
          ? "Ativar tema escuro"
          : "Ativar tema claro";
      }
    };

    const temaSalvo =
      localStorage.getItem("5gnett-tema") || "escuro";

    aplicarTema(temaSalvo);

    const alternarTema = () => {
      const temaClaro =
        document.body.classList.toggle("tema-claro");

      const novoTema = temaClaro ? "claro" : "escuro";

      localStorage.setItem("5gnett-tema", novoTema);

      aplicarTema(novoTema);
    };

    if (btnTema) {
      btnTema.addEventListener("click", alternarTema);
    }

    // O sistema legado continua sendo inicializado somente depois
    // que todo o JSX já foi montado no DOM.
    initializeLegacyApp();

    return () => {
      if (btnTema) {
        btnTema.removeEventListener(
          "click",
          alternarTema
        );
      }
    };
  }, []);

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="logo logo-corporativa-v2">
            <div className="logo-marca-v2">
              <img src={logo} alt="5GNETT" />
            </div>

            <div className="logo-identidade-v2">
              <h1>5GNETT</h1>
              <span>CENTRAL OPERACIONAL</span>

              <div className="logo-status-v2">
                <i></i>
                <strong>OPERAÇÃO ATIVA</strong>
              </div>
            </div>
          </div>

          <nav className="menu menu-profissional-v3">
            <button className="menu-item active" id="menuInicio">
              <span className="menu-icone-v3 menu-home-v3">⌂</span>
              <strong>Início</strong>
              <i className="menu-seta-v3">›</i>
            </button>

            <button className="menu-item" id="menuAtendimentos">
              <span className="menu-icone-v3">📝</span>
              <strong>Atendimentos</strong>
              <i className="menu-seta-v3">›</i>
            </button>

            <button className="menu-item" id="menuNovoAtendimento">
              <span className="menu-icone-v3 menu-add-v3">＋</span>
              <strong>Novo Atendimento</strong>
              <i className="menu-seta-v3">›</i>
            </button>

            <button className="menu-item" id="menuEquipe">
              <span className="menu-icone-v3">👥</span>
              <strong>Equipe</strong>
              <i className="menu-seta-v3">›</i>
            </button>

            <div className="menu-divisor-gerencia-v3">
              <span>ÁREA GERENCIAL</span>
            </div>

            <button className="menu-item menu-gerencia" id="menuBonificacao" data-gerencia="true">
              <span className="menu-icone-v3 menu-trofeu-v3">🏆</span>
              <strong>Bonificação</strong>
              <span className="menu-acoes-v3">
                <b className="menu-lock-v3">🔒</b>
                <i className="menu-seta-v3">›</i>
              </span>
            </button>

            <button className="menu-item menu-gerencia" id="menuRelatorios" data-gerencia="true">
              <span className="menu-icone-v3">📊</span>
              <strong>Relatórios</strong>
              <span className="menu-acoes-v3">
                <b className="menu-lock-v3">🔒</b>
                <i className="menu-seta-v3">›</i>
              </span>
            </button>

            <button className="menu-item menu-gerencia" id="menuConfiguracoes" data-gerencia="true">
              <span className="menu-icone-v3">⚙️</span>
              <strong>Configurações</strong>
              <span className="menu-acoes-v3">
                <b className="menu-lock-v3">🔒</b>
                <i className="menu-seta-v3">›</i>
              </span>
            </button>
          </nav>

          <div className="sidebar-footer sidebar-footer-profissional-v3">
            <div className="sidebar-footer-marca-v3">
              <strong>5GNETT</strong>
              <span>Operações de Suporte</span>
            </div>

            <div className="sidebar-footer-sinal-v3" aria-hidden="true">
              <i></i><i></i><i></i>
            </div>

            <strong className="sidebar-footer-slogan-v3">
              CONECTANDO<br />PESSOAS<br />SEMPRE
            </strong>
          </div>
        </aside>

        <main className="main">
          <header className="topbar topbar-corporativa">
            {/* BOTÃO DE TEMA */}

            <button
              className="btn-tema"
              id="btnTema"
              type="button"
              title="Ativar tema claro"
            >
              ☀️
            </button>

            <div className="usuario usuario-corporativo">
              <div className="avatar">
                <img
                  src={perfil}
                  alt="Perfil"
                  className="usuario-foto"
                />
              </div>

              <div className="usuario-info">
                <strong id="usuarioNome">
                  Equipe 5GNETT
                </strong>

                <span id="usuarioPerfil">
                  Suporte Técnico
                </span>
              </div>

              <button
                className="btn-login-gerencia"
                id="btnLoginGerencia"
                type="button"
              >
                🔐 Admin
              </button>

              <button
                className="btn-sair-gerencia"
                id="btnSairGerencia"
                type="button"
                hidden
              >
                Sair
              </button>
            </div>
          </header>

          {/* =====================================================
              PÁGINA INICIAL
          ===================================================== */}

          <div
            id="paginaInicio"
            className="pagina-app ativa"
          >
            <section className="dashboard-hero">
              <div className="dashboard-hero-copy">
                <span className="dashboard-eyebrow">
                  CENTRAL OPERACIONAL • SUPORTE TÉCNICO
                </span>

                <h2>
                  Visão geral do atendimento
                </h2>

                <p>
                  Acompanhe a operação da equipe e acesse
                  rapidamente os registros de suporte.
                </p>
              </div>

              <div className="dashboard-hero-actions">
                <div
                  className="data-atual"
                  id="dataAtual"
                >
                  --
                </div>

                {/* ID CORRIGIDO */}
                <button
                  className="btn-novo dashboard-cta"
                  id="btnNovoAtendimentoInicio"
                  type="button"
                >
                  ＋ Registrar atendimento
                </button>
              </div>
            </section>

            <section className="dashboard-kpis cards">
              <article className="card kpi-card">
                <div className="kpi-acento kpi-azul"></div>

                <div className="kpi-conteudo">
                  <span>
                    Total de atendimentos
                  </span>

                  <strong id="totalAtendimentos">
                    0
                  </strong>

                  <small>
                    Registros no sistema
                  </small>
                </div>
              </article>

              <article className="card kpi-card">
                <div className="kpi-acento kpi-verde"></div>

                <div className="kpi-conteudo">
                  <span>
                    Resolvidos
                  </span>

                  <strong id="totalResolvidos">
                    0
                  </strong>

                  <small>
                    Atendimentos concluídos
                  </small>
                </div>
              </article>

              <article className="card kpi-card">
                <div className="kpi-acento kpi-vermelho"></div>

                <div className="kpi-conteudo">
                  <span>
                    Não resolvidos
                  </span>

                  <strong id="totalNaoResolvidos">
                    0
                  </strong>

                  <small>
                    Demandas pendentes
                  </small>
                </div>
              </article>

              <article className="card kpi-card kpi-destaque">
                <div className="kpi-acento kpi-dourado"></div>

                <div className="kpi-conteudo">
                  <span>
                    Resolutividade
                  </span>

                  <strong id="taxaResolutividade">
                    0%
                  </strong>

                  <small>
                    Eficiência operacional
                  </small>
                </div>
              </article>
            </section>

            <section className="dashboard-workspace">
              <article className="workspace-panel">
                <div className="workspace-head">
                  <div>
                    <span className="workspace-kicker">
                      ACESSO RÁPIDO
                    </span>

                    <h3>
                      Operação de atendimento
                    </h3>
                  </div>
                </div>

                <div className="workspace-actions">
                  <button
                    type="button"
                    className="workspace-action principal"
                    onClick={() =>
                      document
                        .getElementById(
                          "btnNovoAtendimentoInicio"
                        )
                        ?.click()
                    }
                  >
                    <span className="workspace-action-icon">
                      ＋
                    </span>

                    <span>
                      <strong>
                        Novo atendimento
                      </strong>

                      <small>
                        Registrar conversa ou ligação
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="workspace-action"
                    onClick={() =>
                      document
                        .getElementById(
                          "menuAtendimentos"
                        )
                        ?.click()
                    }
                  >
                    <span className="workspace-action-icon">
                      📝
                    </span>

                    <span>
                      <strong>
                        Consultar registros
                      </strong>

                      <small>
                        Pesquisar, filtrar e editar
                      </small>
                    </span>
                  </button>
                </div>
              </article>

              <article className="workspace-panel workspace-status">
                <div className="workspace-head">
                  <div>
                    <span className="workspace-kicker">
                      AMBIENTE
                    </span>

                    <h3>
                      Status do sistema
                    </h3>
                  </div>

                  <span className="status-online">
                    <i></i>
                    Operacional
                  </span>
                </div>

                <div className="status-linhas">
                  <div>
                    <span>
                      Banco de dados
                    </span>

                    <strong>
                      Supabase Online
                    </strong>
                  </div>

                  <div>
                    <span>
                      Equipe
                    </span>

                    <strong>
                      Suporte Técnico
                    </strong>
                  </div>

                  <div>
                    <span>
                      Módulo
                    </span>

                    <strong>
                      Atendimentos
                    </strong>
                  </div>
                </div>
              </article>
            </section>
          </div>

          {/* =====================================================
              PÁGINA ATENDIMENTOS
          ===================================================== */}

          <div
            id="paginaAtendimentos"
            className="pagina-app"
          >
            <section className="page-header">
              <div>
                <h2>
                  📝 Atendimentos
                </h2>

                <div className="search-box busca-global">
                  <span>⌕</span>

                  <input
                    type="text"
                    id="pesquisa"
                    placeholder="Pesquisar cliente, código, cidade ou atendente..."
                  />
                </div>

                <p>
                  Consulte, filtre, edite e visualize todos
                  os atendimentos registrados.
                </p>
              </div>

              {/* ESTE É O BOTÃO PRINCIPAL DA PÁGINA DE ATENDIMENTOS */}
              <button
                className="btn-novo"
                id="btnNovoAtendimento"
                type="button"
              >
                ＋ Novo Atendimento
              </button>
            </section>

            <section className="filtros filtros-operacionais">
              <div className="campo">
                <label>
                  Data inicial
                </label>

                <input
                  type="date"
                  id="dataInicial"
                />
              </div>

              <div className="campo">
                <label>
                  Data final
                </label>

                <input
                  type="date"
                  id="dataFinal"
                />
              </div>

              <div className="campo">
                <label>
                  Atendente
                </label>

                <select id="filtroAtendente">
                  <option value="">
                    Todos
                  </option>

                  <option value="Guilherme">
                    Guilherme
                  </option>

                  <option value="Ronald">
                    Ronald
                  </option>

                  <option value="Ivo">
                    Ivo
                  </option>

                  <option value="Juarez">
                    Juarez
                  </option>
                </select>
              </div>

              <div className="campo">
                <label>
                  Canal
                </label>

                <select id="filtroCanal">
                  <option value="">
                    Todos
                  </option>

                  <option value="Chatmix">
                    Chatmix
                  </option>

                  <option value="Ligação">
                    Ligação
                  </option>
                </select>
              </div>

              <div className="campo">
                <label>
                  Resolutividade
                </label>

                <select id="filtroResolutividade">
                  <option value="">
                    Todos
                  </option>

                  <option value="Resolvido">
                    Resolvido
                  </option>

                  <option value="Não resolvido">
                    Não resolvido
                  </option>
                </select>
              </div>

              <button
                className="btn-filtrar"
                id="btnFiltrar"
              >
                Filtrar
              </button>

              <button
                className="btn-limpar"
                id="btnLimpar"
              >
                Limpar
              </button>
            </section>

            <section className="atendimentos">
              <div className="section-header">
                <div>
                  <h3>
                    Registros de atendimento
                  </h3>

                  <span id="contadorRegistros">
                    Total de 0 registros
                  </span>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Data</th>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Atendente</th>
                      <th>Cidade</th>
                      <th>Canal</th>
                      <th>Tipo de Serviço</th>
                      <th>Resolutividade</th>
                      <th>⭐ Pontos</th>
                      <th>Conversa / Relato</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody id="tabelaAtendimentos">
                    {/* Registros inseridos pelo JavaScript */}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* =====================================================
              EQUIPE
          ===================================================== */}

          <div
            id="paginaEquipe"
            className="pagina-app pagina-equipe-v1"
          >
            <section className="page-header equipe-header-v1">
              <div>
                <span className="page-eyebrow">
                  OPERAÇÃO • EQUIPE
                </span>

                <h2>
                  Equipe
                </h2>

                <p>
                  Painel de desempenho individual dos atendentes.
                </p>
              </div>
            </section>

            <section className="equipe-grid-v1">
              <button
                className="equipe-card-v1 ativo"
                type="button"
                data-atendente-perfil="Guilherme"
              >
                <span className="equipe-avatar-v1">
                  G
                </span>

                <span>
                  <strong>
                    Guilherme
                  </strong>

                  <small>
                    Suporte Técnico
                  </small>
                </span>

                <b>
                  ATIVO
                </b>
              </button>

              <button
                className="equipe-card-v1"
                type="button"
                data-atendente-perfil="Ronald"
              >
                <span className="equipe-avatar-v1">
                  R
                </span>

                <span>
                  <strong>
                    Ronald
                  </strong>

                  <small>
                    Suporte Técnico
                  </small>
                </span>

                <b>
                  ATIVO
                </b>
              </button>

              <button
                className="equipe-card-v1"
                type="button"
                data-atendente-perfil="Ivo"
              >
                <span className="equipe-avatar-v1">
                  I
                </span>

                <span>
                  <strong>
                    Ivo
                  </strong>

                  <small>
                    Suporte Técnico
                  </small>
                </span>

                <b>
                  ATIVO
                </b>
              </button>

              <button
                className="equipe-card-v1"
                type="button"
                data-atendente-perfil="Juarez"
              >
                <span className="equipe-avatar-v1">
                  J
                </span>

                <span>
                  <strong>
                    Juarez
                  </strong>

                  <small>
                    Suporte Técnico
                  </small>
                </span>

                <b>
                  ATIVO
                </b>
              </button>
            </section>

            <section className="equipe-painel-v1">
              <div className="equipe-perfil-head-v1">
                <div
                  className="equipe-foto-v1"
                  id="perfilEquipeAvatar"
                >
                  <img
                    id="perfilEquipeFoto"
                    alt="Foto do atendente"
                    hidden
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                      display: "none",
                    }}
                  />

                  <span id="perfilEquipeInicial">
                    G
                  </span>
                </div>

                <div>
                  <span className="workspace-kicker">
                    PAINEL DO ATENDENTE
                  </span>

                  <h3 id="perfilEquipeNome">
                    Guilherme
                  </h3>

                  <p>
                    Suporte Técnico • 5GNETT
                  </p>

                  <div
                    className="equipe-foto-acoes-v1"
                    id="equipeFotoAcoes"
                    hidden
                  >
                    <input
                      id="inputFotoEquipe"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                    />

                    <button
                      id="btnAlterarFotoEquipe"
                      className="btn-alterar-foto-v1"
                      type="button"
                    >
                      Alterar foto
                    </button>

                    <small id="statusFotoEquipe"></small>
                  </div>
                </div>

                <div className="equipe-meta-v1">
                  <span>
                    META INDIVIDUAL
                  </span>

                  <strong id="perfilEquipePontosTopo">
                    0 pts
                  </strong>

                  <small>
                    250 pts para atingir a meta
                  </small>
                </div>
              </div>

              <div className="equipe-kpis-v1">
                <div>
                  <span>PONTOS</span>

                  <strong id="perfilEquipePontos">
                    0
                  </strong>

                  <small>
                    Saldo individual
                  </small>
                </div>

                <div>
                  <span>ATENDIMENTOS</span>

                  <strong id="perfilEquipeTotal">
                    0
                  </strong>

                  <small>
                    Total registrado
                  </small>
                </div>

                <div>
                  <span>RESOLUTIVIDADE</span>

                  <strong id="perfilEquipeTaxa">
                    0%
                  </strong>

                  <small>
                    Atendimentos resolvidos
                  </small>
                </div>

                <div>
                  <span>MÉDIA</span>

                  <strong id="perfilEquipeMedia">
                    0.0
                  </strong>

                  <small>
                    Pontos por atendimento
                  </small>
                </div>

                <div>
                  <span>PENALIZAÇÕES</span>

                  <strong id="perfilEquipePenalizacoes">
                    0
                  </strong>

                  <small>
                    Ocorrências
                  </small>
                </div>
              </div>

              <div className="equipe-progresso-v1">
                <div>
                  <span className="workspace-kicker">
                    PROGRESSO INDIVIDUAL
                  </span>

                  <strong>
                    Bonificação
                  </strong>

                  <b id="perfilEquipeProgressoTexto">
                    0 / 350 pts
                  </b>
                </div>

                <div className="equipe-trilho-v1">
                  <i id="perfilEquipeProgressoBarra"></i>

                  <em title="Meta: 250 pts"></em>
                </div>

                <footer>
                  <span>0</span>

                  <span>
                    250 pts • Meta
                  </span>

                  <span>
                    350 pts • +20%
                  </span>
                </footer>
              </div>

              <div className="equipe-detalhes-v1">
                <article>
                  <header>
                    <span className="workspace-kicker">
                      QUALIDADE
                    </span>

                    <h4>
                      Classificações
                    </h4>
                  </header>

                  <div className="equipe-class-v1">
                    <div>
                      <span>
                        Simples
                      </span>

                      <strong id="perfilEquipeSimples">
                        0
                      </strong>

                      <small>
                        3 pts
                      </small>
                    </div>

                    <div>
                      <span>
                        Normal
                      </span>

                      <strong id="perfilEquipeNormal">
                        0
                      </strong>

                      <small>
                        4 pts
                      </small>
                    </div>

                    <div>
                      <span>
                        Complexo
                      </span>

                      <strong id="perfilEquipeComplexo">
                        0
                      </strong>

                      <small>
                        5 pts
                      </small>
                    </div>

                    <div>
                      <span>
                        Excelente
                      </span>

                      <strong id="perfilEquipeExcelente">
                        0
                      </strong>

                      <small>
                        6 pts
                      </small>
                    </div>
                  </div>
                </article>

                <article>
                  <header>
                    <span className="workspace-kicker">
                      PENALIZAÇÕES
                    </span>

                    <h4>
                      Ocorrências
                    </h4>
                  </header>

                  <div className="equipe-erros-v1">
                    <div>
                      <span>
                        Erro leve
                      </span>

                      <strong id="perfilEquipeErroLeve">
                        0
                      </strong>

                      <small>
                        −2 pts
                      </small>
                    </div>

                    <div>
                      <span>
                        Erro grave
                      </span>

                      <strong id="perfilEquipeErroGrave">
                        0
                      </strong>

                      <small>
                        −5 pts
                      </small>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>

          {/* =====================================================
              BONIFICAÇÃO
          ===================================================== */}

          <div
            id="paginaBonificacao"
            className="pagina-app"
          >
            <section className="page-header bonificacao-header">
              <div>
                <span className="page-eyebrow">
                  GESTÃO • DESEMPENHO
                </span>

                <h2>
                  Bonificação
                </h2>

                <p>
                  Acompanhe pontuação, qualidade e evolução individual da equipe.
                </p>
              </div>

              <div className="bonificacao-metas-topo">
                <div>
                  <span>
                    META INDIVIDUAL
                  </span>

                  <strong>
                    250 pts
                  </strong>
                </div>

                <div>
                  <span>
                    FAIXA INDIVIDUAL
                  </span>

                  <strong>
                    350 pts
                  </strong>

                  <small>
                    +20%
                  </small>
                </div>
              </div>
            </section>

            <section className="fechamento-mensal-v1">
              <div className="fechamento-mensal-info">
                <span className="workspace-kicker">
                  FECHAMENTO MENSAL
                </span>

                <h3>
                  Competência da bonificação
                </h3>

                <p>
                  Consolide e preserve o resultado individual dos atendentes ao encerrar o mês.
                </p>
              </div>

              <div className="fechamento-mensal-controles">
                <div className="fechamento-competencia-v1">
                  <span>
                    COMPETÊNCIA
                  </span>

                  <strong id="fechamentoCompetencia">
                    --/----
                  </strong>
                </div>

                <div
                  className="fechamento-status-v1"
                  id="fechamentoStatus"
                >
                  <span>
                    STATUS
                  </span>

                  <strong>
                    ABERTO
                  </strong>
                </div>

                <button
                  className="btn-historico-fechamentos-v1"
                  id="btnHistoricoFechamentos"
                  type="button"
                >
                  Histórico
                </button>

                <button
                  className="btn-fechar-mes-v1"
                  id="btnFecharMes"
                  type="button"
                >
                  Fechar mês
                </button>
              </div>
            </section>

            <section className="filtros filtros-bonificacao bonificacao-toolbar">
              <div className="campo">
                <label>
                  Data inicial
                </label>

                <input
                  type="date"
                  id="bonificacaoDataInicial"
                />
              </div>

              <div className="campo">
                <label>
                  Data final
                </label>

                <input
                  type="date"
                  id="bonificacaoDataFinal"
                />
              </div>

              <button
                className="btn-filtrar"
                id="btnFiltrarBonificacao"
                type="button"
              >
                Atualizar
              </button>

              <button
                className="btn-limpar"
                id="btnLimparBonificacao"
                type="button"
              >
                Limpar
              </button>
            </section>

            <section className="bonificacao-resumo performance-kpis">
              <div className="bonificacao-resumo-item">
                <span>
                  Atendimentos no período
                </span>

                <strong id="bonifTotal">
                  0
                </strong>
              </div>

              <div className="bonificacao-resumo-item">
                <span>
                  Resolvidos pela equipe
                </span>

                <strong id="bonifResolvidos">
                  0
                </strong>
              </div>

              <div className="bonificacao-resumo-item">
                <span>
                  Resolutividade da equipe
                </span>

                <strong id="bonifTaxaEquipe">
                  0%
                </strong>
              </div>
            </section>

            <section className="bonificacao-destaque performance-lider">
              <div className="performance-lider-selo">
                01
              </div>

              <div className="bonificacao-destaque-texto">
                <span>
                  LÍDER DO PERÍODO
                </span>

                <h3 id="bonifLiderNome">
                  Nenhum atendimento
                </h3>

                <p id="bonifLiderResumo">
                  Cadastre atendimentos para gerar o ranking da equipe.
                </p>
              </div>

              <div className="bonificacao-destaque-taxa">
                <span>
                  PONTUAÇÃO
                </span>

                <strong id="bonifLiderTaxa">
                  0 pts
                </strong>
              </div>
            </section>

            <section className="ranking-equipe performance-ranking">
              <div className="section-header">
                <div>
                  <span className="workspace-kicker">
                    DESEMPENHO INDIVIDUAL
                  </span>

                  <h3>
                    Ranking da equipe
                  </h3>

                  <span>
                    Classificação por pontos, média, resolutividade e volume de atendimentos.
                  </span>
                </div>

                <div className="ranking-legenda">
                  <span>
                    <i className="legenda-meta"></i>
                    250 pts Meta individual
                  </span>

                  <span>
                    <i className="legenda-superior"></i>
                    350 pts Faixa individual (+20%)
                  </span>
                </div>
              </div>

              <div
                className="ranking-grid"
                id="rankingBonificacao"
              >
                <article className="ranking-card">
                  <div className="ranking-posicao">
                    1º
                  </div>

                  <h4>
                    Guilherme
                  </h4>

                  <strong>
                    0 pts
                  </strong>

                  <span>
                    0 atendimentos • média 0,00 pts
                  </span>
                </article>

                <article className="ranking-card">
                  <div className="ranking-posicao">
                    2º
                  </div>

                  <h4>
                    Ronald
                  </h4>

                  <strong>
                    0 pts
                  </strong>

                  <span>
                    0 atendimentos • média 0,00 pts
                  </span>
                </article>

                <article className="ranking-card">
                  <div className="ranking-posicao">
                    3º
                  </div>

                  <h4>
                    Ivo
                  </h4>

                  <strong>
                    0 pts
                  </strong>

                  <span>
                    0 atendimentos • média 0,00 pts
                  </span>
                </article>

                <article className="ranking-card">
                  <div className="ranking-posicao">
                    4º
                  </div>

                  <h4>
                    Juarez
                  </h4>

                  <strong>
                    0 pts
                  </strong>

                  <span>
                    0 atendimentos • média 0,00 pts
                  </span>
                </article>
              </div>
            </section>

            <section className="bonificacao-regras">
              <div>
                <span className="workspace-kicker">
                  CRITÉRIOS
                </span>

                <h3>
                  Regra de pontuação
                </h3>
              </div>

              <div className="regra-pontos-grid">
                <span>
                  <b>3</b>
                  Simples
                </span>

                <span>
                  <b>4</b>
                  Normal
                </span>

                <span>
                  <b>5</b>
                  Complexo
                </span>

                <span>
                  <b>6</b>
                  Excelente
                </span>

                <span className="regra-negativa">
                  <b>−2</b>
                  Erro leve
                </span>

                <span className="regra-negativa">
                  <b>−5</b>
                  Erro grave
                </span>
              </div>
            </section>
          </div>

          {/* =====================================================
              RELATÓRIOS
          ===================================================== */}

          <div
            id="paginaRelatorios"
            className="pagina-app pagina-relatorios-v2"
          >
            <section className="page-header relatorios-header-v2">
              <div>
                <span className="page-eyebrow">
                  GESTÃO • ANÁLISE OPERACIONAL
                </span>

                <h2>
                  Relatórios
                </h2>

                <p>
                  Visão consolidada dos atendimentos e do desempenho individual da equipe.
                </p>
              </div>
            </section>

            <section className="filtros filtros-relatorios relatorios-toolbar-v2">
              <div className="campo">
                <label>
                  Data inicial
                </label>

                <input
                  type="date"
                  id="relatorioDataInicial"
                />
              </div>

              <div className="campo">
                <label>
                  Data final
                </label>

                <input
                  type="date"
                  id="relatorioDataFinal"
                />
              </div>

              <div className="campo">
                <label>
                  Atendente
                </label>

                <select id="relatorioAtendente">
                  <option value="">
                    Todos
                  </option>

                  <option value="Guilherme">
                    Guilherme
                  </option>

                  <option value="Ronald">
                    Ronald
                  </option>

                  <option value="Ivo">
                    Ivo
                  </option>

                  <option value="Juarez">
                    Juarez
                  </option>
                </select>
              </div>

              <button
                className="btn-filtrar"
                id="btnFiltrarRelatorio"
                type="button"
              >
                Filtrar
              </button>

              <button
                className="btn-limpar"
                id="btnLimparRelatorio"
                type="button"
              >
                Limpar
              </button>
            </section>

            <section className="relatorios-kpi-strip">
              <div className="relatorios-kpi-item">
                <span>
                  ATENDIMENTOS
                </span>

                <strong id="relTotal">
                  0
                </strong>

                <small>
                  Total no período
                </small>
              </div>

              <div className="relatorios-kpi-item">
                <span>
                  RESOLVIDOS
                </span>

                <strong id="relResolvidos">
                  0
                </strong>

                <small>
                  Concluídos pela equipe
                </small>
              </div>

              <div className="relatorios-kpi-item">
                <span>
                  PENDENTES
                </span>

                <strong id="relNaoResolvidos">
                  0
                </strong>

                <small>
                  Não resolvidos
                </small>
              </div>

              <div className="relatorios-kpi-item destaque">
                <span>
                  RESOLUTIVIDADE
                </span>

                <strong id="relTaxa">
                  0%
                </strong>

                <small>
                  Eficiência no período
                </small>
              </div>
            </section>

            <section className="relatorios-canais-strip">
              <div className="relatorios-canais-titulo">
                <span className="workspace-kicker">
                  CANAIS
                </span>

                <strong>
                  Distribuição dos atendimentos
                </strong>
              </div>

              <div className="relatorios-canal-item">
                <span>
                  Chatmix
                </span>

                <strong id="relChatmix">
                  0
                </strong>
              </div>

              <div className="relatorios-canal-item">
                <span>
                  Ligações
                </span>

                <strong id="relLigacoes">
                  0
                </strong>
              </div>
            </section>

            <section className="relatorios-desempenho-v2">
              <div className="relatorios-desempenho-head">
                <div>
                  <span className="workspace-kicker">
                    ANÁLISE INDIVIDUAL
                  </span>

                  <h3>
                    Desempenho por atendente
                  </h3>

                  <p>
                    Volume, canais utilizados e resolutividade de cada integrante da equipe.
                  </p>
                </div>

                <span className="relatorios-indicador">
                  4 ATENDENTES
                </span>
              </div>

              <div className="table-container relatorios-table-wrap">
                <table className="tabela-relatorio tabela-relatorio-v2">
                  <thead>
                    <tr>
                      <th>Atendente</th>
                      <th>Total</th>
                      <th>Resolvidos</th>
                      <th>Não Resolvidos</th>
                      <th>Chatmix</th>
                      <th>Ligações</th>
                      <th>Resolutividade</th>
                    </tr>
                  </thead>

                  <tbody id="tabelaRelatorioAtendentes">
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          textAlign: "center",
                          padding: "30px",
                          color: "#69747e",
                        }}
                      >
                        Os dados serão carregados automaticamente.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* =====================================================
              CONFIGURAÇÕES
          ===================================================== */}

          <div
            id="paginaConfiguracoes"
            className="pagina-app pagina-config-v2"
          >
            <section className="page-header config-header-v2">
              <div>
                <span className="page-eyebrow">
                  ADMINISTRAÇÃO • SISTEMA
                </span>

                <h2>
                  Configurações
                </h2>

                <p>
                  Consulte a equipe, regras operacionais e o estado atual da plataforma.
                </p>
              </div>

              <span className="config-admin-badge">
                ACESSO GERÊNCIA
              </span>
            </section>

            <section className="config-painel-v2">
              <article className="config-secao-v2 config-equipe-v2">
                <div className="config-secao-head-v2">
                  <div>
                    <span className="workspace-kicker">
                      EQUIPE
                    </span>

                    <h3>
                      Equipe de atendimento
                    </h3>

                    <p>
                      Integrantes cadastrados na operação de suporte.
                    </p>
                  </div>

                  <span className="config-contador-v2">
                    4 ATIVOS
                  </span>
                </div>

                <div className="config-equipe-tabela-v2">
                  <div className="config-atendente-v2">
                    <span className="config-avatar-v2">
                      G
                    </span>

                    <div>
                      <strong>
                        Guilherme
                      </strong>

                      <small>
                        Suporte Técnico
                      </small>
                    </div>

                    <span className="config-status-v2">
                      ATIVO
                    </span>
                  </div>

                  <div className="config-atendente-v2">
                    <span className="config-avatar-v2">
                      R
                    </span>

                    <div>
                      <strong>
                        Ronald
                      </strong>

                      <small>
                        Suporte Técnico
                      </small>
                    </div>

                    <span className="config-status-v2">
                      ATIVO
                    </span>
                  </div>

                  <div className="config-atendente-v2">
                    <span className="config-avatar-v2">
                      I
                    </span>

                    <div>
                      <strong>
                        Ivo
                      </strong>

                      <small>
                        Suporte Técnico
                      </small>
                    </div>

                    <span className="config-status-v2">
                      ATIVO
                    </span>
                  </div>

                  <div className="config-atendente-v2">
                    <span className="config-avatar-v2">
                      J
                    </span>

                    <div>
                      <strong>
                        Juarez
                      </strong>

                      <small>
                        Suporte Técnico
                      </small>
                    </div>

                    <span className="config-status-v2">
                      ATIVO
                    </span>
                  </div>
                </div>
              </article>

              <div className="config-coluna-v2">
                <article className="config-secao-v2">
                  <div className="config-secao-head-v2">
                    <div>
                      <span className="workspace-kicker">
                        DESEMPENHO
                      </span>

                      <h3>
                        Regra de bonificação
                      </h3>

                      <p>
                        Pontuação e metas aplicadas individualmente.
                      </p>
                    </div>
                  </div>

                  <div className="config-regra-v2">
                    <div>
                      <span>Simples</span>
                      <strong>3 pts</strong>
                    </div>

                    <div>
                      <span>Normal</span>
                      <strong>4 pts</strong>
                    </div>

                    <div>
                      <span>Complexo</span>
                      <strong>5 pts</strong>
                    </div>

                    <div>
                      <span>Excelente</span>
                      <strong>6 pts</strong>
                    </div>

                    <div className="negativo">
                      <span>Erro leve</span>
                      <strong>−2 pts</strong>
                    </div>

                    <div className="negativo">
                      <span>Erro grave</span>
                      <strong>−5 pts</strong>
                    </div>
                  </div>

                  <div className="config-metas-v2">
                    <div>
                      <span>
                        META INDIVIDUAL
                      </span>

                      <strong>
                        250 pts
                      </strong>
                    </div>

                    <div>
                      <span>
                        FAIXA SUPERIOR
                      </span>

                      <strong>
                        350 pts
                      </strong>

                      <small>
                        +20%
                      </small>
                    </div>
                  </div>
                </article>

                <article className="config-secao-v2">
                  <div className="config-secao-head-v2">
                    <div>
                      <span className="workspace-kicker">
                        INFRAESTRUTURA
                      </span>

                      <h3>
                        Estado da plataforma
                      </h3>

                      <p>
                        Informações técnicas do ambiente atual.
                      </p>
                    </div>

                    <span className="config-online-v2">
                      <i></i>
                      ONLINE
                    </span>
                  </div>

                  <div className="config-info-v2">
                    <div>
                      <span>
                        Banco de dados
                      </span>

                      <strong>
                        Supabase Online
                      </strong>
                    </div>

                    <div>
                      <span>
                        Sincronização
                      </span>

                      <strong>
                        Ativa
                      </strong>
                    </div>

                    <div>
                      <span>
                        Equipe
                      </span>

                      <strong>
                        Suporte Técnico
                      </strong>
                    </div>

                    <div>
                      <span>
                        Sistema
                      </span>

                      <strong>
                        Central de Atendimento
                      </strong>
                    </div>

                    <div>
                      <span>
                        Versão
                      </span>

                      <strong>
                        1.0
                      </strong>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <footer>
            <div>
              <strong>
                5GNETT
              </strong>

              <span>
                • Central de Atendimento
              </span>
            </div>

            <span>
              Equipe de Suporte Técnico
            </span>
          </footer>
        </main>
      </div>

      {/* =====================================================
          MODAL LOGIN DA GERÊNCIA
      ===================================================== */}

      <div
        className="modal"
        id="modalLoginGerencia"
      >
        <div className="modal-content modal-login-gerencia">
          <div className="modal-header">
            <div>
              <h2>
                🔐 Acesso da Gerência
              </h2>

              <p>
                Entre com a conta administrativa cadastrada no sistema.
              </p>
            </div>

            <button
              className="fechar-modal"
              id="fecharLoginGerencia"
              type="button"
            >
              ×
            </button>
          </div>

          <form id="formLoginGerencia">
            <div className="login-gerencia-campos">
              <div className="campo">
                <label>
                  E-mail
                </label>

                <input
                  type="email"
                  id="emailGerencia"
                  placeholder="E-mail da gerência"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="campo">
                <label>
                  Senha
                </label>

                <input
                  type="password"
                  id="senhaGerencia"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div
                className="login-gerencia-erro"
                id="erroLoginGerencia"
                hidden
              ></div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancelar"
                id="cancelarLoginGerencia"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-salvar"
              >
                Entrar na Gerência
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =====================================================
          MODAL NOVO / EDITAR ATENDIMENTO
      ===================================================== */}

      <div
        className="modal"
        id="modalAtendimento"
      >
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h2>
                Novo Atendimento
              </h2>

              <p>
                Cadastre as informações do atendimento realizado.
              </p>
            </div>

            <button
              className="fechar-modal"
              id="fecharModal"
              type="button"
            >
              ×
            </button>
          </div>

          <form id="formAtendimento">
            <div className="form-grid">
              <div className="campo">
                <label>
                  Data *
                </label>

                <input
                  type="date"
                  id="data"
                  required
                />
              </div>

              <div className="campo">
                <label>
                  Atendente *
                </label>

                <select
                  id="atendente"
                  required
                >
                  <option value="">
                    Selecione
                  </option>

                  <option value="Guilherme">
                    Guilherme
                  </option>

                  <option value="Ronald">
                    Ronald
                  </option>

                  <option value="Ivo">
                    Ivo
                  </option>

                  <option value="Juarez">
                    Juarez
                  </option>
                </select>
              </div>

              <div className="campo">
                <label>
                  Código do cliente *
                </label>

                <input
                  type="text"
                  id="codigo"
                  placeholder="Ex: 91796"
                  required
                />
              </div>

              <div className="campo">
                <label>
                  Cidade *
                </label>

                <select
                  id="cidade"
                  required
                >
                  <option value="">
                    Selecione
                  </option>

                  <option value="Caxambu">
                    Caxambu
                  </option>

                  <option value="Baependi">
                    Baependi
                  </option>

                  <option value="Cruzília">
                    Cruzília
                  </option>

                  <option value="Zona Rural">
                    Zona Rural
                  </option>
                </select>
              </div>

              <div className="campo campo-grande">
                <label>
                  Nome do cliente *
                </label>

                <input
                  type="text"
                  id="nome"
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="campo">
                <label>
                  Canal do atendimento *
                </label>

                <select
                  id="canal"
                  required
                >
                  <option value="Chatmix">
                    Chatmix
                  </option>

                  <option value="Ligação">
                    Ligação
                  </option>
                </select>
              </div>

              <div className="campo">
                <label>
                  Tipo de serviço *
                </label>

                <div
                  ref={servicoComboboxRef}
                  className={`servico-combobox ${servicoAberto ? "aberto" : ""}`}
                >
                  <button
                    type="button"
                    className="servico-combobox-trigger"
                    onClick={alternarServico}
                    aria-expanded={servicoAberto}
                  >
                    <span className={servicoSelecionado ? "selecionado" : ""}>
                      {servicoSelecionado || "Selecione"}
                    </span>
                    <span className="servico-combobox-seta" aria-hidden="true">⌄</span>
                  </button>

                  {servicoAberto && (
                    <div
                      className="servico-combobox-menu servico-combobox-menu-flutuante"
                      style={{
                        position: "fixed",
                        top: `${servicoMenuPosicao.top}px`,
                        left: `${servicoMenuPosicao.left}px`,
                        width: `${servicoMenuPosicao.width}px`,
                        minWidth: 0,
                        zIndex: 100000,
                      }}
                    >
                      <div className="servico-combobox-busca">
                        <span aria-hidden="true">⌕</span>
                        <input
                          type="text"
                          value={servicoBusca}
                          onChange={(event) => setServicoBusca(event.target.value)}
                          placeholder="Filtrar tipo de serviço..."
                          autoFocus
                        />
                      </div>

                      <div
                        className="servico-combobox-lista"
                        style={{ maxHeight: `${servicoMenuPosicao.maxHeight}px` }}
                      >
                        {gruposServicoFiltrados.length ? (
                          gruposServicoFiltrados.map((grupo) => (
                            <div className="servico-combobox-grupo" key={grupo.titulo}>
                              <div className="servico-combobox-grupo-titulo">
                                {grupo.titulo}
                              </div>

                              {grupo.opcoes.map((opcao) => (
                                <button
                                  type="button"
                                  className={`servico-combobox-opcao ${
                                    servicoSelecionado === opcao ? "ativo" : ""
                                  }`}
                                  key={opcao}
                                  onClick={() => selecionarServico(opcao)}
                                >
                                  <span>{opcao}</span>
                                  {servicoSelecionado === opcao && (
                                    <span className="servico-combobox-check" aria-hidden="true">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="servico-combobox-vazio">
                            Nenhum tipo de serviço encontrado.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <select
                    id="servico"
                    required
                    value={servicoSelecionado}
                    onChange={(event) => setServicoSelecionado(event.target.value)}
                    className="servico-select-compatibilidade"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="">Selecione</option>
                    {gruposServico.flatMap((grupo) =>
                      grupo.opcoes.map((opcao) => (
                        <option value={opcao} key={`${grupo.titulo}-${opcao}`}>
                          {opcao}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="campo">
                <label>
                  Resolutividade *
                </label>

                <select
                  id="resolutividade"
                  required
                >
                  <option value="Resolvido">
                    Resolvido
                  </option>

                  <option value="Não resolvido">
                    Não resolvido
                  </option>
                </select>
              </div>

              <div
                className="campo campo-grande"
                id="grupoLink"
              >
                <label>
                  Link da conversa no Chatmix *
                </label>

                <input
                  type="url"
                  id="link"
                  placeholder="https://srv6.chatmix.com.br/..."
                />
              </div>

              <div
                className="campo campo-grande campo-relato"
                id="grupoRelato"
              >
                <label>
                  Relato do atendimento *
                </label>

                <textarea
                  id="relato"
                  rows="7"
                  placeholder="Descreva o que foi tratado com o cliente durante o atendimento..."
                ></textarea>

                <small>
                  Registre aqui as principais informações tratadas com o cliente durante o atendimento.
                </small>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancelar"
                id="cancelarModal"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-salvar"
              >
                Salvar Atendimento
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =====================================================
          MODAL PROFISSIONAL DE AVALIAÇÃO
      ===================================================== */}

      <div
        className="modal"
        id="modalAvaliacao"
      >
        <div className="modal-content modal-avaliacao-content">
          <div className="modal-header">
            <div>
              <span className="page-eyebrow">
                GERÊNCIA • QUALIDADE
              </span>

              <h2>
                Avaliar atendimento
              </h2>

              <p>
                Classifique a complexidade e aplique penalização quando necessário.
              </p>
            </div>

            <button
              className="fechar-modal"
              id="fecharModalAvaliacao"
              type="button"
            >
              ×
            </button>
          </div>

          <div className="avaliacao-identificacao">
            <div>
              <span>CLIENTE</span>

              <strong id="avaliacaoCliente">
                —
              </strong>
            </div>

            <div>
              <span>ATENDENTE</span>

              <strong id="avaliacaoAtendente">
                —
              </strong>
            </div>

            <div>
              <span>CÓDIGO</span>

              <strong id="avaliacaoCodigo">
                —
              </strong>
            </div>
          </div>

          <input
            type="hidden"
            id="avaliacaoAtendimentoId"
          />

          <section className="avaliacao-secao">
            <div className="avaliacao-secao-titulo">
              <div>
                <span className="workspace-kicker">
                  CLASSIFICAÇÃO
                </span>

                <h3>
                  Nível do atendimento
                </h3>
              </div>

              <span>
                Selecione uma opção
              </span>
            </div>

            <div className="avaliacao-opcoes">
              <button
                type="button"
                className="avaliacao-opcao"
                data-classificacao="Simples"
                data-pontos="3"
              >
                <span className="avaliacao-numero">
                  3
                </span>

                <span>
                  <strong>
                    Simples
                  </strong>

                  <small>
                    Orientação ou procedimento básico
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="avaliacao-opcao"
                data-classificacao="Normal"
                data-pontos="4"
              >
                <span className="avaliacao-numero">
                  4
                </span>

                <span>
                  <strong>
                    Normal
                  </strong>

                  <small>
                    Triagem e análise padrão
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="avaliacao-opcao"
                data-classificacao="Complexo"
                data-pontos="5"
              >
                <span className="avaliacao-numero">
                  5
                </span>

                <span>
                  <strong>
                    Complexo
                  </strong>

                  <small>
                    Múltiplos testes e análises
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="avaliacao-opcao"
                data-classificacao="Excelente"
                data-pontos="6"
              >
                <span className="avaliacao-numero">
                  6
                </span>

                <span>
                  <strong>
                    Excelente
                  </strong>

                  <small>
                    Condução completa e registro de alta qualidade
                  </small>
                </span>
              </button>
            </div>
          </section>

          <section className="avaliacao-secao">
            <div className="avaliacao-secao-titulo">
              <div>
                <span className="workspace-kicker">
                  QUALIDADE
                </span>

                <h3>
                  Penalização
                </h3>
              </div>
            </div>

            <div className="avaliacao-penalizacoes">
              <button
                type="button"
                className="avaliacao-penalizacao ativa"
                data-erro=""
                data-penalizacao="0"
              >
                <strong>
                  Nenhuma
                </strong>

                <small>
                  0 pts
                </small>
              </button>

              <button
                type="button"
                className="avaliacao-penalizacao"
                data-erro="Leve"
                data-penalizacao="-2"
              >
                <strong>
                  Erro leve
                </strong>

                <small>
                  −2 pts
                </small>
              </button>

              <button
                type="button"
                className="avaliacao-penalizacao"
                data-erro="Grave"
                data-penalizacao="-5"
              >
                <strong>
                  Erro grave
                </strong>

                <small>
                  −5 pts
                </small>
              </button>
            </div>
          </section>

          <div className="avaliacao-resultado">
            <div>
              <span>
                PONTUAÇÃO FINAL
              </span>

              <small>
                Classificação + eventual penalização
              </small>
            </div>

            <strong id="avaliacaoPontuacaoFinal">
              — pts
            </strong>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancelar"
              id="cancelarAvaliacao"
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-salvar"
              id="salvarAvaliacao"
            >
              Salvar avaliação
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL DE PRÉVIA DO FECHAMENTO MENSAL
      ===================================================== */}

      <div
        className="modal"
        id="modalPreviaFechamento"
      >
        <div className="modal-content modal-previa-fechamento-v1">
          <div className="modal-header">
            <div>
              <span className="page-eyebrow">
                GERÊNCIA • BONIFICAÇÃO
              </span>

              <h2>
                Prévia do fechamento mensal
              </h2>

              <p>
                Confira os resultados individuais antes de confirmar o fechamento definitivo.
              </p>
            </div>

            <button
              className="fechar-modal"
              id="fecharPreviaFechamento"
              type="button"
            >
              ×
            </button>
          </div>

          <div className="previa-fechamento-topo-v1">
            <div>
              <span>
                COMPETÊNCIA
              </span>

              <strong id="previaFechamentoCompetencia">
                —
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                PRÉVIA • NÃO SALVO
              </strong>
            </div>
          </div>

          <div className="previa-fechamento-aviso-v1">
            Nenhum dado será gravado até a confirmação final do fechamento.
          </div>

          <div className="previa-fechamento-tabela-wrap-v1">
            <table className="previa-fechamento-tabela-v1">
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

              <tbody id="previaFechamentoTabela">
                <tr>
                  <td colSpan="8">
                    A prévia será calculada antes do fechamento.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancelar"
              id="cancelarPreviaFechamento"
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-salvar"
              id="confirmarFechamentoMensal"
            >
              Confirmar fechamento
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL HISTÓRICO DE FECHAMENTOS
      ===================================================== */}

      <div
        className="modal"
        id="modalHistoricoFechamentos"
      >
        <div className="modal-content modal-historico-fechamentos-v1">
          <div className="modal-header">
            <div>
              <span className="page-eyebrow">
                GERÊNCIA • BONIFICAÇÃO
              </span>

              <h2>
                Histórico de fechamentos
              </h2>

              <p>
                Consulte as competências já encerradas e os resultados individuais preservados.
              </p>
            </div>

            <button
              className="fechar-modal"
              id="fecharHistoricoFechamentos"
              type="button"
            >
              ×
            </button>
          </div>

          <div className="historico-fechamentos-resumo-v1">
            <div>
              <span>
                COMPETÊNCIAS FECHADAS
              </span>

              <strong id="historicoTotalCompetencias">
                0
              </strong>
            </div>

            <div>
              <span>
                ÚLTIMO FECHAMENTO
              </span>

              <strong id="historicoUltimoFechamento">
                —
              </strong>
            </div>
          </div>

          <div
            className="historico-fechamentos-lista-v1"
            id="historicoFechamentosLista"
          >
            <div className="historico-vazio-v1">
              <strong>
                Nenhum fechamento registrado
              </strong>

              <span>
                As competências encerradas aparecerão aqui automaticamente.
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-salvar"
              id="okHistoricoFechamentos"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          MODAL PARA VISUALIZAR RELATO
      ===================================================== */}

      <div
        className="modal"
        id="modalRelato"
      >
        <div className="modal-content modal-relato-content">
          <div className="modal-header">
            <div>
              <h2>
                📞 Relato da Ligação
              </h2>

              <p id="relatoIdentificacao">
                Atendimento
              </p>
            </div>

            <button
              className="fechar-modal"
              id="fecharModalRelato"
              type="button"
            >
              ×
            </button>
          </div>

          <div
            className="relato-visualizacao"
            id="textoRelato"
          ></div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-salvar"
              id="okRelato"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
