/**
 * =============================================================
 * NAVALHA & CO. — Sistema de Agendamento para Barbearia
 * =============================================================
 * Arquitetura:
 *   - App: estado global (dados) + update() + roteamento de views
 *   - ClienteFluxo: fluxo de agendamento para o cliente
 *   - PainelBarbeiro: painel administrativo do barbeiro
 *   - Persistência: localStorage via salvarDados/carregarDados
 * =============================================================
 */

import { useState, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

// ─────────────────────────────────────────────────────────────
// COMPONENTE: QRCodeDisplay
// Reutilizável, sem dependência de API externa.
// Código completo também disponível em:
//   src/components/common/QRCodeDisplay/QRCodeDisplay.jsx
// ─────────────────────────────────────────────────────────────

/**
 * QRCodeDisplay — renderiza QR Code SVG localmente via qrcode.react.
 *
 * @prop {string}  url       — Conteúdo a codificar (URL, código PIX, etc.)
 * @prop {number}  tamanho   — Tamanho em px (padrão: 200)
 * @prop {boolean} exibirUrl — Mostrar URL abaixo do QR (padrão: false)
 * @prop {string}  titulo    — Título acima do QR (opcional)
 */
function QRCodeDisplay({ url, tamanho = 200, exibirUrl = false, titulo = null }) {
  if (!url) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      {titulo && <p style={es.sectionTitulo}>{titulo}</p>}
      <div style={{ borderRadius:12, overflow:"hidden", border:"2px solid var(--gold)", lineHeight:0 }}>
        <QRCodeSVG
          value={url}
          size={tamanho}
          bgColor="#111111"
          fgColor="#c9a84c"
          level="M"
          includeMargin={true}
        />
      </div>
      {exibirUrl && (
        <p style={es.qrUrl} title={url}>
          {url.length > 50 ? `${url.substring(0, 47)}...` : url}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONSTANTES GLOBAIS
// ─────────────────────────────────────────────────────────────

/** Chave usada para salvar/carregar dados no localStorage */
const CHAVE_STORAGE = "barbearia_data";

/** Dias da semana em português */
const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Todos os horários possíveis de 08:00 a 19:30 em intervalos de 30 min */
const TODOS_HORARIOS = [];
for (let h = 8; h <= 19; h++) {
  TODOS_HORARIOS.push(`${String(h).padStart(2, "0")}:00`);
  TODOS_HORARIOS.push(`${String(h).padStart(2, "0")}:30`);
}

// ─────────────────────────────────────────────────────────────
// ESTRUTURA DE DADOS PADRÃO
// ─────────────────────────────────────────────────────────────
const dadosPadrao = {
  /**
   * Barbeiros cadastrados: [{ id, nome, senha, eAdmin? }]
   * O administrador tem id fixo "admin" e eAdmin=true.
   * Seu perfil NUNCA pode ser excluído pelo sistema.
   */
  barbeiros: [
    { id: "admin", nome: "Administrador", senha: "admin123", eAdmin: true },
    { id: "b1", nome: "Carlos", senha: "1234" },
    { id: "b2", nome: "Rafael", senha: "1234" },
  ],

  /**
   * Clientes cadastrados.
   * { [telefone]: { telefone, nome, cortes, proximoGratis } }
   */
  clientes: {},

  /**
   * Agendamentos realizados.
   * Campos:
   *   id, telefone, barbeiroId, data, horario, servicoId,
   *   status    — "agendado" | "concluído" | "cancelado" | "pago"
   *   concluido — boolean (true somente após o barbeiro marcar como concluído)
   *               ESTE campo é a fonte de verdade para o sistema de fidelidade.
   *               Agendamentos futuros/pendentes têm concluido: false.
   *   eGratis   — boolean (agendamento usou corte gratuito da fidelidade)
   *               Agendamentos gratuitos NÃO contam para acumular o próximo.
   *   pagamento, codigoPix
   */
  agendamentos: [],

  /**
   * Serviços dinâmicos (substitui array estático antigo).
   * [{ id, label, preco }]
   */
  servicos: [
    { id: "corte", label: "Corte", preco: 35 },
    { id: "barba", label: "Barba", preco: 25 },
    { id: "corte_barba", label: "Corte + Barba", preco: 55 },
    { id: "degradê", label: "Degradê", preco: 40 },
    { id: "sobrancelha", label: "Sobrancelha", preco: 15 },
  ],

  /** Horários globais por dia da semana (fallback quando barbeiro não tem config própria) */
  horariosGlobais: {
    1: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    2: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    3: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    4: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    5: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    6: ["09:00","09:30","10:00","10:30","11:00"],
  },

  /** Horários por barbeiro: { [barbeiroId]: { [diaSemana]: [horarios] } } */
  horariosPorBarbeiro: {},

  /** Configuração do programa de fidelidade */
  fidelidadeConfig: { ativo: true, cortesNecessarios: 5 },

  /** Senha global legada — compatibilidade com dados v1 */
  barberPassword: "1234",
};

// ─────────────────────────────────────────────────────────────
// FUNÇÕES UTILITÁRIAS
// ─────────────────────────────────────────────────────────────

/** Carrega dados do localStorage com migração automática de v1 → v2 */
function carregarDados() {
  // =========================================================
  // TODO: Integrar com Supabase — LEITURA INICIAL
  // =========================================================
  // Schema real da tabela `agendamentos` no Supabase:
  //
  //   id        bigint  (PK, auto-increment)
  //   nome      text    (nome do cliente — desnormalizado)
  //   data      date
  //   hora      text    ← diferente de `horario` no frontend
  //   phone     text    ← diferente de `telefone` no frontend
  //   service   text    ← diferente de `servicoId` no frontend
  //   status    text    default 'agendado'
  //   "isFree"  boolean ← diferente de `eGratis` no frontend (camelCase com aspas!)
  //   concluido boolean default false
  //
  // ATENÇÃO: use normalizarAgendamentoDoSupabase() ao ler
  //          e formatarAgendamentoParaSupabase() ao escrever.
  //
  // Exemplo de leitura:
  //   const { data, error } = await supabase
  //     .from('agendamentos')
  //     .select('*')
  //     .order('data', { ascending: true });
  //   const agendamentos = data.map(normalizarAgendamentoDoSupabase);
  //
  // Exemplo completo de carregamento inicial:
  //   async function carregarDadosRemoto() {
  //     const { data: agendamentos } = await supabase
  //       .from('agendamentos').select('*').order('data');
  //     return {
  //       ...dadosPadrao,
  //       agendamentos: (agendamentos || []).map(normalizarAgendamentoDoSupabase),
  //     };
  //   }
  // =========================================================
  try {
    const raw = localStorage.getItem(CHAVE_STORAGE);
    if (!raw) return dadosPadrao;
    const salvo = JSON.parse(raw);

    // Migração: loyaltyConfig → fidelidadeConfig
    const fidelidadeConfig = salvo.fidelidadeConfig || (salvo.loyaltyConfig
      ? { ativo: salvo.loyaltyConfig.enabled, cortesNecessarios: salvo.loyaltyConfig.cutsRequired }
      : dadosPadrao.fidelidadeConfig);

    // Migração: availableSlots → horariosGlobais
    const horariosGlobais = salvo.horariosGlobais || salvo.availableSlots || dadosPadrao.horariosGlobais;

    // Migração: clients → clientes (formato antigo)
    const clientes = salvo.clientes || {};
    if (salvo.clients && !salvo.clientes) {
      Object.entries(salvo.clients).forEach(([tel, c]) => {
        clientes[tel] = { telefone: tel, nome: c.name, cortes: c.cuts || 0, proximoGratis: c.freeNext || false };
      });
    }

    // Migração: appointments → agendamentos (formato antigo)
    const agendamentos = salvo.agendamentos || [];
    if (salvo.appointments && !salvo.agendamentos) {
      salvo.appointments.forEach(a => agendamentos.push({
        id: a.id, telefone: a.phone, barbeiroId: a.barberId || null,
        data: a.date, horario: a.time, servicoId: a.service, status: a.status,
        // concluido é derivado do status para compatibilidade com dados v1
        concluido: a.status === "concluído",
        eGratis: a.isFree || false, pagamento: "presencial", codigoPix: null,
      }));
    }

    // Migração: garante campo concluido em agendamentos salvos sem ele (v2 → v3)
    agendamentos.forEach(a => {
      if (a.concluido === undefined) {
        // Inferência: se status é "concluído", concluido deve ser true
        a.concluido = a.status === "concluído";
      }
    });

    return {
      ...dadosPadrao, ...salvo,
      fidelidadeConfig, horariosGlobais, clientes, agendamentos,
      // Garante que o admin sempre existe — mesmo em dados salvos antes desta versão
      barbeiros: (() => {
        const lista = salvo.barbeiros || dadosPadrao.barbeiros;
        const temAdmin = lista.some(b => b.id === "admin");
        if (!temAdmin) return [dadosPadrao.barbeiros[0], ...lista]; // injeta admin no topo
        return lista;
      })(),
      servicos: salvo.servicos || dadosPadrao.servicos,
      horariosPorBarbeiro: salvo.horariosPorBarbeiro || {},
    };
  } catch { return dadosPadrao; }
}

/** Salva dados no localStorage */
function salvarDados(dados) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));

  // =========================================================
  // TODO: Integrar com Supabase — ESCRITA / SINCRONIZAÇÃO
  // =========================================================
  // Esta função é chamada toda vez que update() modifica o estado.
  // Na versão com Supabase, use formatarAgendamentoParaSupabase()
  // para converter os campos antes de enviar.
  //
  // Exemplo — inserir novo agendamento:
  //   const payload = formatarAgendamentoParaSupabase(novoAgendamento, nomeCliente);
  //   await supabase.from('agendamentos').insert(payload);
  //
  // Exemplo — concluir agendamento:
  //   await supabase.from('agendamentos')
  //     .update({ status: 'concluído', concluido: true })
  //     .eq('id', id);
  //
  // Exemplo — cancelar agendamento:
  //   await supabase.from('agendamentos')
  //     .update({ status: 'cancelado' })
  //     .eq('id', id);
  //
  // ATENÇÃO ao campo "isFree" — precisa de aspas duplas no SQL
  // porque é camelCase. No JS via SDK, passe como objeto normal:
  //   { "isFree": true }   ← o SDK do Supabase lida corretamente
  // =========================================================
}

/** Formata número de telefone: 11999998888 → (11) 99999-8888 */
function formatarTelefone(valor) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Retorna array com os próximos N dias como objetos Date */
function proximosDias(n = 14) {
  const hoje = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    return d;
  });
}

/** Converte Date para string "YYYY-MM-DD" */
function chaveData(data) {
  return data.toISOString().split("T")[0];
}

/** Formata valor numérico em reais: 35 → "R$ 35,00" */
function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

/**
 * Gera um código PIX falso para fins de simulação.
 * Em produção: integrar com API de pagamentos real (ex: OpenPix, Efí Bank).
 *
 * Correção aplicada: padStart era 6 dígitos e estourava com valores > R$99,99.
 * Agora usa 10 dígitos para suportar valores até R$999.999,99.
 */
function gerarCodigoPix(valor, nome) {
  const aleatorio = Math.random().toString(36).substring(2, 10).toUpperCase();
  const nomeLimpo = (nome || "Cliente").substring(0, 13).padEnd(13);
  // Usa 10 dígitos para o valor em centavos — suporta qualquer preço razoável
  const valorCentavos = String(Math.round(valor * 100)).padStart(10, "0");
  return `00020126580014BR.GOV.BCB.PIX0136navalha-co@pix.com.br520400005303986540${valorCentavos.length}${valorCentavos}5802BR5913${nomeLimpo}6009SAOPAULO62070503${aleatorio}6304ABCD`;
}

/**
 * Valida se um número de telefone brasileiro é válido.
 * Regras: mínimo 10 dígitos (fixo) ou 11 (celular com dígito 9).
 * Não aceita sequências óbvias inválidas como 00000000000.
 *
 * @param {string} telefoneBruto — apenas dígitos, sem formatação
 * @returns {boolean}
 */
function validarTelefone(telefoneBruto) {
  const d = telefoneBruto.replace(/\D/g, "");
  if (d.length < 10 || d.length > 11) return false;
  // Rejeita sequências de dígitos repetidos (ex: 11111111111)
  if (/^(\d)\1+$/.test(d)) return false;
  return true;
}

/**
 * Verifica se já existe um agendamento ativo para o mesmo barbeiro,
 * na mesma data e horário. Usado para evitar duplo agendamento.
 *
 * @param {Array}  agendamentos    — lista atual de agendamentos
 * @param {string} barbeiroId      — id do barbeiro
 * @param {string} data            — "YYYY-MM-DD"
 * @param {string} horario         — "HH:MM"
 * @returns {boolean} true se o slot já estiver ocupado
 */
function verificarAgendamentoDuplicado(agendamentos, barbeiroId, data, horario) {
  return agendamentos.some(
    a =>
      a.barbeiroId === barbeiroId &&
      a.data === data &&
      a.horario === horario &&
      a.status !== "cancelado"
  );
}

/** Retorna cor de fundo do badge conforme status do agendamento */
function corStatus(status) {
  const cores = { agendado: "#2563eb", concluído: "#16a34a", cancelado: "#dc2626", pago: "#c9a84c" };
  return cores[status] || "#6b7280";
}

// ─────────────────────────────────────────────────────────────
// LÓGICA DE FIDELIDADE — FUNÇÕES PURAS
// Separadas aqui para facilitar testes e reutilização.
// ─────────────────────────────────────────────────────────────

/**
 * Conta quantos cortes REAIS um cliente concluiu.
 *
 * REGRA CRÍTICA DE FIDELIDADE:
 * Apenas agendamentos com status === "concluído" E concluido === true
 * são contabilizados. Agendamentos futuros ou pendentes NÃO contam.
 * Agendamentos gratuitos (eGratis) também NÃO somam ao contador —
 * o corte gratuito é um benefício, não uma contribuição ao programa.
 *
 * Isso impede a trapaça de agendar muitos cortes futuros para
 * acumular fidelidade sem tê-los realizado de fato.
 *
 * @param {Array}  agendamentos — lista completa de agendamentos
 * @param {string} telefone     — telefone do cliente a verificar
 * @returns {number} quantidade de cortes reais concluídos (sem contar grátis)
 */
function contarCortesReais(agendamentos, telefone) {
  return agendamentos.filter(
    a =>
      (a.telefone === telefone || a.phone === telefone) &&
      a.status === "concluído" &&
      a.concluido === true &&
      !a.eGratis // cortes gratuitos não contam para acumular o próximo
  ).length;
}

/**
 * Verifica se um cliente tem direito ao próximo corte gratuito.
 * Usa APENAS cortes concluídos — nunca agendamentos futuros.
 *
 * @param {Array}  agendamentos      — lista completa de agendamentos
 * @param {string} telefone          — telefone do cliente
 * @param {number} cortesNecessarios — quantidade de cortes para ganhar 1 grátis
 * @returns {boolean} true se o próximo corte deve ser gratuito
 */
function calcularProximoGratis(agendamentos, telefone, cortesNecessarios) {
  const cortesReais = contarCortesReais(agendamentos, telefone);
  // Só ativa após pelo menos um ciclo completo (ex: 5, 10, 15...)
  return cortesReais > 0 && cortesReais % cortesNecessarios === 0;
}

// ─────────────────────────────────────────────────────────────
// MAPEAMENTO SUPABASE ↔ FRONTEND
//
// O schema do Supabase usa nomes de colunas diferentes dos campos
// usados internamente no frontend. Estas duas funções fazem a
// tradução nos dois sentidos e são o ÚNICO lugar onde essa lógica
// deve existir. Se o schema mudar, só muda aqui.
//
// Schema real da tabela `agendamentos`:
//   id, nome, data, hora, phone, service, status, "isFree", concluido
// ─────────────────────────────────────────────────────────────

/**
 * Converte um registro do Supabase para o formato interno do frontend.
 * Chamada ao CARREGAR dados do Supabase.
 *
 * Mapeamento:
 *   Supabase `hora`     → frontend `horario`
 *   Supabase `phone`    → frontend `telefone`
 *   Supabase `service`  → frontend `servicoId`
 *   Supabase `"isFree"` → frontend `eGratis`
 *   Supabase `nome`     → usado apenas para exibição (não é salvo no cliente)
 *
 * @param {object} registro — linha retornada pelo Supabase
 * @returns {object} agendamento no formato interno do frontend
 */
function normalizarAgendamentoDoSupabase(registro) {
  return {
    // Campos com nome igual — passam direto
    id:        registro.id,
    data:      registro.data,
    status:    registro.status   || "agendado",
    concluido: registro.concluido ?? false,
    // Campos com nome diferente — tradução explícita
    horario:   registro.hora,      // hora   → horario
    telefone:  registro.phone,     // phone  → telefone
    servicoId: registro.service,   // service → servicoId
    eGratis:   registro["isFree"] ?? false, // "isFree" → eGratis
    // Campo extra do Supabase (nome desnormalizado do cliente)
    // Armazenado para fallback de exibição quando não há cliente no local state
    nomeCliente: registro.nome,
    // Campos locais sem equivalente no Supabase (apenas localStorage)
    barbeiroId: registro.barbeiroId || null,
    pagamento:  registro.pagamento  || "presencial",
    codigoPix:  registro.codigoPix  || null,
  };
}

/**
 * Converte um agendamento do frontend para o formato do Supabase.
 * Chamada ao INSERIR ou ATUALIZAR dados no Supabase.
 *
 * @param {object} agendamento — agendamento interno do frontend
 * @param {string} nomeCliente — nome do cliente (para desnormalizar na tabela)
 * @returns {object} payload pronto para enviar ao Supabase
 */
function formatarAgendamentoParaSupabase(agendamento, nomeCliente = "") {
  return {
    // Campos com nome diferente — tradução explícita
    hora:      agendamento.horario,    // horario  → hora
    phone:     agendamento.telefone,   // telefone → phone
    service:   agendamento.servicoId,  // servicoId → service
    "isFree":  agendamento.eGratis ?? false, // eGratis → "isFree"
    // Campos com nome igual
    data:      agendamento.data,
    status:    agendamento.status,
    concluido: agendamento.concluido ?? false,
    // Campo desnormalizado: Supabase armazena o nome do cliente diretamente
    // para facilitar queries sem JOIN (ex: listagem da agenda do barbeiro)
    nome:      nomeCliente,
    // Nota: `id` não é enviado no INSERT (gerado pelo Supabase automaticamente)
    // No UPDATE, use .eq('id', agendamento.id) na query, não inclua no payload
  };
}



/**
 * App — componente raiz da aplicação.
 * Responsável pelo estado global e roteamento entre views.
 */
export default function App() {
  const [dados, setDados] = useState(carregarDados);
  const [view, setView] = useState("inicio"); // "inicio" | "cliente" | "barbeiro"
  const [barbeiroAutenticado, setBarbeiroAutenticado] = useState(null);
  const [barbeiroPreSelecionado, setBarbeiroPreSelecionado] = useState(null);

  /**
   * Função central de mutação de estado.
   * Recebe fn pura → clona estado → aplica → salva localStorage → atualiza React.
   * SEMPRE use update() para modificar dados. Nunca mute o estado diretamente.
   *
   * TODO: Quando o Supabase estiver integrado, esta função também deve
   * receber um parâmetro opcional `operacaoRemota` para sync assíncrono:
   *
   *   const update = useCallback((fn, operacaoRemota = null) => {
   *     setDados(prev => {
   *       const proximo = fn(structuredClone(prev));
   *       salvarDados(proximo);          // localStorage (fase atual)
   *       operacaoRemota?.().catch(...); // Supabase (fase futura)
   *       return proximo;
   *     });
   *   }, []);
   */
  const update = useCallback((fn) => {
    setDados(prev => {
      const proximo = fn(structuredClone(prev));
      salvarDados(proximo);
      return proximo;
    });
  }, []);

  /** Navega para agendamento, opcionalmente com barbeiro já selecionado (Flow B) */
  const irParaAgendamento = (barbeiro = null) => {
    setBarbeiroPreSelecionado(barbeiro);
    setView("cliente");
  };

  return (
    <div style={es.root}>
      <style>{css}</style>
      {view === "inicio" && <TelaInicio dados={dados} setView={setView} irParaAgendamento={irParaAgendamento} />}
      {view === "cliente" && <ClienteFluxo dados={dados} update={update} setView={setView} barbeiroPreSelecionado={barbeiroPreSelecionado} />}
      {view === "barbeiro" && <PainelBarbeiro dados={dados} update={update} setView={setView} barbeiroAutenticado={barbeiroAutenticado} setBarbeiroAutenticado={setBarbeiroAutenticado} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TELA INICIAL
// ─────────────────────────────────────────────────────────────

/**
 * TelaInicio — tela de boas-vindas.
 * Oferece agendamento geral (Flow A) ou por barbeiro específico (Flow B).
 */
function TelaInicio({ dados, setView, irParaAgendamento }) {
  const [mostrarQR, setMostrarQR] = useState(false);

  return (
    <div style={es.home}>
      <div style={es.homeBg} />
      <div style={es.homeContent}>
        <div style={es.logoWrap}>
          <span style={es.logoTesoura}>✂</span>
          <h1 style={es.logoTexto}>NAVALHA<span style={es.logoDestaque}>&</span>CO.</h1>
          <p style={es.logoSub}>Barbearia Tradicional</p>
        </div>

        <div style={es.homeBotoes}>
          <button className="btn-primary" onClick={() => irParaAgendamento(null)}>
            <span>Agendar Horário</span>
            <span style={{ marginLeft: 8 }}>→</span>
          </button>
          <button className="btn-ghost" onClick={() => setView("barbeiro")}>
            Painel do Barbeiro
          </button>
        </div>

        {/* Seleção rápida de barbeiro (Flow B) — admin não aparece aqui */}
        {dados.barbeiros?.filter(b => !b.eAdmin).length > 0 && (
          <div style={es.barbeiroRapido}>
            <p style={es.barbeiroRapidoTitulo}>Agendar com barbeiro específico:</p>
            <div style={es.barbeiroRapidoGrid}>
              {dados.barbeiros.filter(b => !b.eAdmin).map(b => (
                <button key={b.id} className="btn-barbeiro" onClick={() => irParaAgendamento(b)}>
                  <span style={es.barbeiroAvatar}>{b.nome.charAt(0)}</span>
                  <span>{b.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn-ghost" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setMostrarQR(true)}>
          🔳 QR Code da Barbearia
        </button>
      </div>

      <div style={es.homeDecor}>
        <div style={es.decorLinha} />
        <span style={es.decorTexto}>EST. 2024</span>
        <div style={es.decorLinha} />
      </div>

      {mostrarQR && <ModalQRCode dados={dados} onFechar={() => setMostrarQR(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FLUXO DO CLIENTE
// ─────────────────────────────────────────────────────────────

/**
 * ClienteFluxo — gerencia todas as etapas do agendamento.
 *
 * Flow A (padrão): telefone → [nome] → barbeiro → servico → pagamento → confirmacao → concluido
 * Flow B (direto):  telefone → [nome] → servico → pagamento → confirmacao → concluido
 */
function ClienteFluxo({ dados, update, setView, barbeiroPreSelecionado }) {
  const [etapa, setEtapa] = useState("telefone");
  const [telefone, setTelefone] = useState("");
  const [telefoneBruto, setTelefoneBruto] = useState("");
  const [nomeDigitado, setNomeDigitado] = useState("");
  const [erroNome, setErroNome] = useState(""); // mensagem de erro para o campo nome
  const [eNovo, setENovo] = useState(false);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(barbeiroPreSelecionado);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [metodoPagamento, setMetodoPagamento] = useState(null);
  const [codigoPix, setCodigoPix] = useState(null);
  // Mensagem de erro exibida na tela de confirmação (ex: slot duplicado)
  const [erroAgendamento, setErroAgendamento] = useState("");

  const cliente = dados.clientes[telefoneBruto];
  const fidelidade = dados.fidelidadeConfig;
  const servico = dados.servicos?.find(s => s.id === servicoSelecionado);

  /**
   * Calcula horários livres para um barbeiro em uma data.
   * Remove slots já ocupados por agendamentos confirmados do mesmo barbeiro.
   */
  const horariosDisponiveis = useCallback((data, barbeiro) => {
    if (!data || !barbeiro) return [];
    const diaSemana = data.getDay();
    const dataStr = chaveData(data);
    const slots = dados.horariosPorBarbeiro?.[barbeiro.id]?.[diaSemana]
      || dados.horariosGlobais?.[diaSemana] || [];
    const ocupados = dados.agendamentos
      .filter(a => a.data === dataStr && a.barbeiroId === barbeiro.id && a.status !== "cancelado")
      .map(a => a.horario);
    return slots.filter(h => !ocupados.includes(h));
  }, [dados]);

  /** Dias com pelo menos um horário disponível nos próximos 14 dias */
  const diasComVaga = useMemo(() =>
    proximosDias(14).filter(d => horariosDisponiveis(d, barbeiroSelecionado).length > 0),
    [barbeiroSelecionado, horariosDisponiveis]
  );

  /**
   * Etapa 1 — valida telefone usando a função validarTelefone().
   * Rejeita números com menos de 10 dígitos, sequências inválidas (00000...).
   * Decide se é cliente novo (→ etapa nome) ou existente (→ barbeiro/serviço).
   */
  const handleTelefoneSubmit = () => {
    if (!validarTelefone(telefoneBruto)) return;
    if (!dados.clientes[telefoneBruto]) {
      setENovo(true);
      setEtapa("nome");
    } else {
      setEtapa(barbeiroPreSelecionado ? "servico" : "barbeiro");
    }
  };

  /**
   * Etapa 2 — valida e salva o nome do cliente novo.
   * Regras: não vazio, mínimo 2 caracteres, apenas letras e espaços.
   */
  const handleNomeSubmit = () => {
    const nomeLimpo = nomeDigitado.trim();

    // Validação: nome muito curto
    if (nomeLimpo.length < 2) {
      setErroNome("Digite um nome com pelo menos 2 caracteres.");
      return;
    }
    // Validação: apenas letras, espaços e acentos (sem números ou símbolos)
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nomeLimpo)) {
      setErroNome("O nome deve conter apenas letras.");
      return;
    }

    setErroNome("");
    update(d => {
      // TODO: Supabase — inserir novo cliente
      // supabase.from('clientes').insert({ telefone, nome: nomeLimpo, cortes: 0, proximo_gratis: false })
      d.clientes[telefoneBruto] = {
        telefone: telefoneBruto,
        nome: nomeLimpo,
        cortes: 0,
        proximoGratis: false,
      };
      return d;
    });
    setEtapa(barbeiroPreSelecionado ? "servico" : "barbeiro");
  };

  /**
   * Etapa final — cria o agendamento com todos os dados coletados.
   * Valida duplicata e elegibilidade de corte gratuito antes de salvar.
   * IMPORTANTE: a fidelidade NÃO é atualizada aqui — apenas na conclusão
   * pelo barbeiro (função concluir em AbaAgenda). Isso impede que clientes
   * acumulem cortes futuros não realizados.
   */
  const handleAgendar = () => {
    // ── Validação: agendamento duplicado ──────────────────────
    const dataStr = chaveData(dataSelecionada);
    if (verificarAgendamentoDuplicado(dados.agendamentos, barbeiroSelecionado?.id, dataStr, horarioSelecionado)) {
      setErroAgendamento("Este horário acabou de ser reservado. Por favor, escolha outro.");
      setEtapa("servico");
      return;
    }

    // ── Validação: elegibilidade do corte gratuito ────────────
    // Recalcula a partir dos cortes REAIS concluídos — não do contador em memória.
    // Isso garante que um cliente não possa usar o benefício de gratuidade
    // baseado em agendamentos futuros que ainda não foram realizados.
    const cortesReaisAtuais = contarCortesReais(dados.agendamentos, telefoneBruto);
    const realmenteProximoGratis =
      fidelidade.ativo &&
      cortesReaisAtuais > 0 &&
      cortesReaisAtuais % fidelidade.cortesNecessarios === 0;

    // Se o cliente acredita que tem gratuidade mas os cortes reais não confirmam, bloqueia
    const eGratis = realmenteProximoGratis && (cliente?.proximoGratis === true);

    const precoFinal = eGratis ? 0 : (servico?.preco || 0);
    const pixGerado = metodoPagamento === "pix"
      ? gerarCodigoPix(precoFinal, cliente?.nome || "Cliente")
      : null;

    update(d => {
      // TODO: Supabase — inserir agendamento com campos corretos
      //
      // const nomeCliente = d.clientes[telefoneBruto]?.nome || "";
      // const payload = formatarAgendamentoParaSupabase({
      //   telefone: telefoneBruto,
      //   horario: horarioSelecionado,
      //   servicoId: servicoSelecionado,
      //   data: dataStr,
      //   status: metodoPagamento === "pix" ? "pago" : "agendado",
      //   concluido: false,
      //   eGratis,
      // }, nomeCliente);
      //
      // payload resultante para o Supabase:
      // {
      //   nome:      nomeCliente,   ← coluna `nome`
      //   data:      "2025-01-15",  ← coluna `data`
      //   hora:      "10:00",       ← coluna `hora` (não `horario`!)
      //   phone:     "11999998888", ← coluna `phone` (não `telefone`!)
      //   service:   "corte",       ← coluna `service` (não `servicoId`!)
      //   status:    "agendado",
      //   concluido: false,
      //   "isFree":  false,         ← coluna `"isFree"` (não `eGratis`!)
      // }
      //
      // const { data: inserido, error } = await supabase
      //   .from('agendamentos')
      //   .insert(payload)
      //   .select()
      //   .single();
      // if (error) console.error('Erro ao inserir agendamento:', error);
      d.agendamentos.push({
        id: Date.now(),
        telefone: telefoneBruto,
        barbeiroId: barbeiroSelecionado?.id || null,
        data: dataStr,
        horario: horarioSelecionado,
        servicoId: servicoSelecionado,
        status: metodoPagamento === "pix" ? "pago" : "agendado",
        concluido: false,
        eGratis,
        pagamento: metodoPagamento,
        codigoPix: pixGerado,
      });

      // ── FIDELIDADE: NÃO atualizar aqui! ──────────────────────
      // O contador de fidelidade é calculado dinamicamente a partir
      // dos agendamentos com concluido===true. A atualização de
      // cliente.cortes e cliente.proximoGratis acontece APENAS quando
      // o barbeiro marca o agendamento como concluído em AbaAgenda.
      // Isso elimina a possibilidade de acúmulo antecipado indevido.

      return d;
    });

    setCodigoPix(pixGerado);
    setErroAgendamento("");
    setEtapa("concluido");
  };

  // Índice de progresso para os pontinhos no cabeçalho
  const ordemEtapas = ["telefone","nome","barbeiro","servico","pagamento","confirmacao","concluido"];
  const indiceAtual = ordemEtapas.indexOf(etapa);

  return (
    <div style={es.panel}>
      <header style={es.panelHeader}>
        <button className="btn-back" onClick={() => setView("inicio")}>← Voltar</button>
        <h2 style={es.panelTitulo}>Agendamento</h2>
        <div style={es.progressoWrap}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ ...es.progressoPonto, background: i <= indiceAtual ? "var(--gold)" : "var(--surface2)" }} />
          ))}
        </div>
      </header>

      <div style={es.panelBody}>

        {/* ── TELEFONE ─────────────────────────── */}
        {etapa === "telefone" && (
          <div className="fade-in" style={es.formCard}>
            <h3 style={es.cardTitulo}>Qual é o seu número?</h3>
            <p style={es.cardSub}>Usamos apenas seu telefone para identificação</p>
            <input
              style={es.input} placeholder="(00) 00000-0000" value={telefone}
              onChange={e => { const f = formatarTelefone(e.target.value); setTelefone(f); setTelefoneBruto(f.replace(/\D/g,"")); }}
              onKeyDown={e => e.key === "Enter" && handleTelefoneSubmit()}
            />
            {/* Mensagem auxiliar: guia o usuário sobre o formato esperado */}
            {telefoneBruto.length > 0 && !validarTelefone(telefoneBruto) && (
              <p style={{ ...es.cardSub, color:"#f87171", marginTop:6 }}>
                Digite um número de telefone válido (DDD + número).
              </p>
            )}
            {fidelidade.ativo && dados.clientes[telefoneBruto] && (
              <BadgeFidelidade
                cliente={dados.clientes[telefoneBruto]}
                config={fidelidade}
                agendamentos={dados.agendamentos}
              />
            )}
            <button
              className="btn-primary"
              style={{ marginTop: 24, width: "100%" }}
              onClick={handleTelefoneSubmit}
              disabled={!validarTelefone(telefoneBruto)}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── NOME (cliente novo) ──────────────── */}
        {etapa === "nome" && (
          <div className="fade-in" style={es.formCard}>
            <div style={{ textAlign:"center", marginBottom:20 }}><span style={{fontSize:40}}>👋</span></div>
            <h3 style={es.cardTitulo}>Bem-vindo!</h3>
            <p style={es.cardSub}>Número não encontrado. Para completar o cadastro, informe seu nome:</p>
            <input
              style={{ ...es.input, borderColor: erroNome ? "#f87171" : undefined }}
              placeholder="Seu nome completo"
              value={nomeDigitado}
              onChange={e => { setNomeDigitado(e.target.value); setErroNome(""); }}
              onKeyDown={e => e.key === "Enter" && handleNomeSubmit()}
            />
            {/* Exibe erro de validação do nome, se houver */}
            {erroNome && <p style={{ ...es.cardSub, color:"#f87171", marginTop:6 }}>{erroNome}</p>}
            <button className="btn-primary" style={{ marginTop: 20, width: "100%" }} onClick={handleNomeSubmit} disabled={!nomeDigitado.trim()}>
              Cadastrar e Continuar →
            </button>
          </div>
        )}

        {/* ── BARBEIRO (Flow A) ────────────────── */}
        {etapa === "barbeiro" && (
          <div className="fade-in">
            {eNovo && <div style={es.barraBoasVindas}>🎉 Cadastro realizado! Agora escolha seu barbeiro.</div>}
            {fidelidade.ativo && calcularProximoGratis(dados.agendamentos, telefoneBruto, fidelidade.cortesNecessarios) && cliente?.proximoGratis && (
              <div style={es.barraGratis}>🎁 Seu próximo corte é <strong>GRATUITO</strong>!</div>
            )}
            <div style={es.section}>
              <h3 style={es.sectionTitulo}>Escolha o Barbeiro</h3>
              {/* Admin é filtrado — não deve aparecer como opção de atendimento */}
              <div style={es.barbeiroGrid}>
                {dados.barbeiros?.filter(b => !b.eAdmin).map(b => (
                  <button key={b.id} className={`barbeiro-card ${barbeiroSelecionado?.id===b.id?"active":""}`} onClick={() => setBarbeiroSelecionado(b)}>
                    <span style={es.barbeiroAvatarGrande}>{b.nome.charAt(0)}</span>
                    <span style={es.barbeiroNome}>{b.nome}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" style={{ width:"100%" }} disabled={!barbeiroSelecionado} onClick={() => setEtapa("servico")}>
              Continuar →
            </button>
          </div>
        )}

        {/* ── SERVIÇO + DATA + HORÁRIO ─────────── */}
        {etapa === "servico" && (
          <div className="fade-in">
            {eNovo && !barbeiroPreSelecionado && <div style={es.barraBoasVindas}>🎉 Cadastro realizado com sucesso!</div>}
            {fidelidade.ativo && calcularProximoGratis(dados.agendamentos, telefoneBruto, fidelidade.cortesNecessarios) && cliente?.proximoGratis && (
              <div style={es.barraGratis}>🎁 Seu próximo corte é <strong>GRATUITO</strong>!</div>
            )}
            {/* Alerta de horário duplicado — exibido quando handleAgendar detecta conflito */}
            {erroAgendamento && (
              <div style={{ background:"#2d0a0a", border:"1px solid #dc2626", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#fca5a5", fontSize:14 }}>
                ⚠️ {erroAgendamento}
              </div>
            )}

            {/* Confirmação do barbeiro escolhido */}
            {barbeiroSelecionado && (
              <div style={es.barbeiroConfirmado}>
                <span style={es.barbeiroAvatarPequeno}>{barbeiroSelecionado.nome.charAt(0)}</span>
                <span>Barbeiro: <strong>{barbeiroSelecionado.nome}</strong></span>
                {!barbeiroPreSelecionado && (
                  <button className="btn-back" style={{ marginLeft:"auto" }} onClick={() => setEtapa("barbeiro")}>Trocar</button>
                )}
              </div>
            )}

            {/* Serviços dinâmicos */}
            <div style={es.section}>
              <h3 style={es.sectionTitulo}>Escolha o Serviço</h3>
              <div style={es.servicoGrid}>
                {(() => {
                  // Recalcula gratuidade com base em cortes REAIS concluídos
                  // (não o contador em memória que pode incluir agendamentos futuros)
                  const cortesReais = contarCortesReais(dados.agendamentos, telefoneBruto);
                  const temGratuidadeReal =
                    fidelidade.ativo &&
                    cortesReais > 0 &&
                    cortesReais % fidelidade.cortesNecessarios === 0 &&
                    cliente?.proximoGratis === true;

                  return dados.servicos?.map(s => (
                    <button key={s.id} className={`service-card ${servicoSelecionado===s.id?"active":""}`} onClick={() => setServicoSelecionado(s.id)}>
                      <span style={es.servicoLabel}>{s.label}</span>
                      <span style={es.servicoPreco}>
                        {temGratuidadeReal ? "GRÁTIS" : formatarPreco(s.preco)}
                      </span>
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Grade de dias */}
            <div style={es.section}>
              <h3 style={es.sectionTitulo}>Escolha o Dia</h3>
              {diasComVaga.length === 0
                ? <p style={es.cardSub}>Nenhum horário disponível nos próximos dias.</p>
                : (
                  <div style={es.diaGrid}>
                    {diasComVaga.map(d => (
                      <button key={chaveData(d)} className={`day-card ${dataSelecionada && chaveData(dataSelecionada)===chaveData(d)?"active":""}`}
                        onClick={() => { setDataSelecionada(d); setHorarioSelecionado(null); }}>
                        <span style={es.diaNome}>{DIAS_PT[d.getDay()]}</span>
                        <span style={es.diaNumero}>{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Grade de horários */}
            {dataSelecionada && (
              <div style={es.section} className="fade-in">
                <h3 style={es.sectionTitulo}>Horários Disponíveis</h3>
                <div style={es.horarioGrid}>
                  {horariosDisponiveis(dataSelecionada, barbeiroSelecionado).map(h => (
                    <button key={h} className={`time-slot ${horarioSelecionado===h?"active":""}`} onClick={() => setHorarioSelecionado(h)}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ width:"100%", marginTop:24 }}
              disabled={!dataSelecionada || !horarioSelecionado || !servicoSelecionado}
              onClick={() => setEtapa("pagamento")}>
              Continuar →
            </button>
          </div>
        )}

        {/* ── PAGAMENTO ────────────────────────── */}
        {etapa === "pagamento" && (
          <div className="fade-in" style={es.formCard}>
            <h3 style={es.cardTitulo}>Como deseja pagar?</h3>
            <p style={es.cardSub}>
              {cliente?.proximoGratis && fidelidade.ativo
                ? "🎁 Este corte é gratuito pelo programa de fidelidade!"
                : `Total: ${formatarPreco(servico?.preco || 0)}`}
            </p>
            <div style={es.pagamentoOpcoes}>
              <button className={`pagamento-card ${metodoPagamento==="pix"?"active":""}`} onClick={() => setMetodoPagamento("pix")}>
                <span style={es.pagamentoIcone}>📱</span>
                <span style={es.pagamentoLabel}>Pagar agora</span>
                <span style={es.pagamentoSub}>Via PIX</span>
              </button>
              <button className={`pagamento-card ${metodoPagamento==="presencial"?"active":""}`} onClick={() => setMetodoPagamento("presencial")}>
                <span style={es.pagamentoIcone}>💵</span>
                <span style={es.pagamentoLabel}>Pagar na hora</span>
                <span style={es.pagamentoSub}>Dinheiro / Cartão</span>
              </button>
            </div>
            <div style={{ display:"flex", gap:12, marginTop:24 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={() => setEtapa("servico")}>← Voltar</button>
              <button className="btn-primary" style={{ flex:2 }} disabled={!metodoPagamento} onClick={() => setEtapa("confirmacao")}>Revisar →</button>
            </div>
          </div>
        )}

        {/* ── CONFIRMAÇÃO ──────────────────────── */}
        {etapa === "confirmacao" && (
          <div className="fade-in" style={es.formCard}>
            <h3 style={es.cardTitulo}>Confirmar Agendamento</h3>
            <div style={es.confirmCard}>
              <Linha label="Cliente" value={cliente?.nome || formatarTelefone(telefoneBruto)} />
              <Linha label="Telefone" value={formatarTelefone(telefoneBruto)} />
              <Linha label="Barbeiro" value={barbeiroSelecionado?.nome || "—"} />
              <Linha label="Serviço" value={servico?.label} />
              <Linha label="Data" value={dataSelecionada?.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})} />
              <Linha label="Horário" value={horarioSelecionado} />
              <Linha label="Pagamento" value={metodoPagamento==="pix" ? "PIX (online)" : "Presencial"} />
              <Linha label="Valor" value={cliente?.proximoGratis && fidelidade.ativo ? "🎁 Gratuito!" : formatarPreco(servico?.preco||0)} destaque={cliente?.proximoGratis && fidelidade.ativo} />
            </div>
            <div style={{ display:"flex", gap:12, marginTop:24 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={() => setEtapa("pagamento")}>← Voltar</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={handleAgendar}>Confirmar ✓</button>
            </div>
          </div>
        )}

        {/* ── CONCLUÍDO ────────────────────────── */}
        {etapa === "concluido" && (
          <div className="fade-in" style={{ ...es.formCard, textAlign:"center" }}>
            <div style={es.iconeSuccesso}>✓</div>
            <h3 style={es.cardTitulo}>Agendado!</h3>
            <p style={es.cardSub}>
              Com <strong>{barbeiroSelecionado?.nome}</strong> em{" "}
              <strong>{dataSelecionada?.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</strong> às <strong>{horarioSelecionado}</strong>.
            </p>

            {/* Exibe PIX inline se pagamento online */}
            {metodoPagamento === "pix" && codigoPix && (
              <ModalPix codigo={codigoPix} valor={cliente?.proximoGratis && fidelidade.ativo ? 0 : (servico?.preco||0)} inline />
            )}

            {fidelidade.ativo && <BadgeFidelidade cliente={dados.clientes[telefoneBruto]} config={fidelidade} agendamentos={dados.agendamentos} />}

            <button className="btn-primary" style={{ marginTop:24, width:"100%" }} onClick={() => setView("inicio")}>
              Voltar ao Início
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAINEL DO BARBEIRO
// ─────────────────────────────────────────────────────────────

/**
 * PainelBarbeiro — área administrativa protegida por senha.
 * Login: selecionar barbeiro + senha individual (ou senha global legada).
 */
function PainelBarbeiro({ dados, update, setView, barbeiroAutenticado, setBarbeiroAutenticado }) {
  const [aba, setAba] = useState("agenda");
  const [barbeiroLogin, setBarbeiroLogin] = useState(null);
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState(false);

  /** Autentica barbeiro comparando senha individual ou global */
  const handleLogin = () => {
    if (!barbeiroLogin) return;
    const correto = senha === barbeiroLogin.senha || senha === dados.barberPassword;
    if (correto) setBarbeiroAutenticado(barbeiroLogin);
    else setErroSenha(true);
  };

  // ── Tela de login ──────────────────────────────────────────
  if (!barbeiroAutenticado) {
    return (
      <div style={es.panel}>
        <header style={es.panelHeader}>
          <button className="btn-back" onClick={() => setView("inicio")}>← Voltar</button>
          <h2 style={es.panelTitulo}>Área do Barbeiro</h2>
          <div />
        </header>
        <div style={es.panelBody}>
          <div className="fade-in" style={es.formCard}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <span style={{ fontSize:48 }}>🔐</span>
              <h3 style={es.cardTitulo}>Acesso Restrito</h3>
              <p style={es.cardSub}>Selecione seu perfil e digite a senha</p>
            </div>
            <div style={es.barbeiroGrid}>
              {dados.barbeiros?.map(b => (
                <button key={b.id} className={`barbeiro-card ${barbeiroLogin?.id===b.id?"active":""}`}
                  onClick={() => { setBarbeiroLogin(b); setErroSenha(false); setSenha(""); }}>
                  <span style={es.barbeiroAvatarGrande}>{b.nome.charAt(0)}</span>
                  <span style={es.barbeiroNome}>{b.nome}</span>
                </button>
              ))}
            </div>
            {barbeiroLogin && (
              <>
                <input type="password" style={{ ...es.input, marginTop:16 }} placeholder={`Senha de ${barbeiroLogin.nome}`}
                  value={senha} onChange={e => { setSenha(e.target.value); setErroSenha(false); }}
                  onKeyDown={e => e.key==="Enter" && handleLogin()} />
                {erroSenha && <p style={es.erro}>Senha incorreta.</p>}
                <button className="btn-primary" style={{ width:"100%", marginTop:16 }} onClick={handleLogin}>Entrar</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Painel autenticado ──────────────────────────────────────
  // eAdmin determina quais abas e permissões o usuário logado possui
  const eAdmin = !!barbeiroAutenticado.eAdmin;

  const abas = [
    { id:"agenda", label:"📅 Agenda" },
    { id:"horarios", label:"⏰ Horários" },
    { id:"fidelidade", label:"⭐ Fidelidade" },
    { id:"clientes", label:"👥 Clientes" },
    { id:"servicos", label:"💈 Serviços" },
    // Aba de gerenciamento da equipe: EXCLUSIVA do administrador
    ...(eAdmin ? [{ id:"barbeiros", label:"✂️ Equipe" }] : []),
    { id:"qrcode", label:"🔳 QR Code" },
  ];

  return (
    <div style={es.panel}>
      <header style={es.panelHeader}>
        <button className="btn-back" onClick={() => { setBarbeiroAutenticado(null); setView("inicio"); }}>← Sair</button>
        <h2 style={es.panelTitulo}>
          Olá, {barbeiroAutenticado.nome} {eAdmin ? "👑" : "✂"}
        </h2>
        <div />
      </header>
      <div style={es.tabBar}>
        {abas.map(a => (
          <button key={a.id} className={`tab-btn ${aba===a.id?"active":""}`} onClick={() => setAba(a.id)}>{a.label}</button>
        ))}
      </div>
      <div style={es.panelBody}>
        {/* Admin vê todos os agendamentos; barbeiro comum vê apenas os seus */}
        {aba === "agenda"     && <AbaAgenda dados={dados} update={update} barbeiro={barbeiroAutenticado} eAdmin={eAdmin} />}
        {aba === "horarios"   && <AbaHorarios dados={dados} update={update} barbeiro={barbeiroAutenticado} />}
        {aba === "fidelidade" && <AbaFidelidade dados={dados} update={update} />}
        {aba === "clientes"   && <AbaClientes dados={dados} update={update} />}
        {aba === "servicos"   && <AbaServicos dados={dados} update={update} />}
        {/* Aba Barbeiros: renderizada somente se eAdmin (dupla proteção além da ocultação da aba) */}
        {aba === "barbeiros" && eAdmin && <AbaBarbeiros dados={dados} update={update} />}
        {aba === "qrcode"     && <AbaQRCode dados={dados} barbeiro={barbeiroAutenticado} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA AGENDA
// ─────────────────────────────────────────────────────────────

/**
 * AbaAgenda — lista e gerencia agendamentos.
 * Admin vê todos os agendamentos de todos os barbeiros.
 * Barbeiro comum vê apenas os seus próprios.
 *
 * @prop {boolean} eAdmin — se verdadeiro, exibe todos os agendamentos e nome do barbeiro
 */
function AbaAgenda({ dados, update, barbeiro, eAdmin }) {
  const [filtro, setFiltro] = useState("futuros");
  const hoje = chaveData(new Date());

  // =========================================================
  // TODO: Supabase — buscar agendamentos ao montar o componente
  // useEffect(() => {
  //   const query = eAdmin
  //     ? supabase.from('agendamentos').select('*, clientes(*), barbeiros(*), servicos(*)')
  //     : supabase.from('agendamentos').select('*, clientes(*), servicos(*)').eq('barbeiro_id', barbeiro.id);
  //   query.then(({ data }) => setAgendamentosRemoto(data));
  // }, []);
  // =========================================================

  // Admin vê tudo; barbeiro comum filtra pelo seu próprio id
  let lista = [...dados.agendamentos]
    .filter(a => eAdmin || !a.barbeiroId || a.barbeiroId === barbeiro.id)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  if (filtro === "hoje")      lista = lista.filter(a => a.data === hoje);
  if (filtro === "pendentes") lista = lista.filter(a => a.status === "agendado");
  if (filtro === "futuros")   lista = lista.filter(a => a.data >= hoje);

  const concluir = id => update(d => {
    // TODO: Supabase:
    // supabase.from('agendamentos').update({ status: 'concluído', concluido: true }).eq('id', id)
    const ag = d.agendamentos.find(x => x.id === id);
    if (!ag) return d;

    // Marca o agendamento como concluído — ÚNICA fonte de verdade para fidelidade
    ag.status = "concluído";
    ag.concluido = true; // campo explícito para facilitar queries no Supabase

    // ── Atualiza fidelidade do cliente ────────────────────────
    // A fidelidade só é recalculada AQUI (na conclusão pelo barbeiro),
    // nunca no momento do agendamento. Isso impede trapaças com
    // agendamentos futuros acumulando pontos indevidamente.
    const cfg = d.fidelidadeConfig;
    if (cfg.ativo) {
      const clienteDoBarbeiro = d.clientes[ag.telefone || ag.phone];
      if (clienteDoBarbeiro) {
        // Reconta os cortes reais a partir dos agendamentos concluídos
        // (inclui o que acabamos de marcar como concluído acima)
        const cortesReais = contarCortesReais(d.agendamentos, ag.telefone || ag.phone);

        // Atualiza o campo denormalizado para exibição rápida na UI
        clienteDoBarbeiro.cortes = cortesReais;

        // Verifica se atingiu o limiar para o próximo gratuito
        // Ex: cortesNecessarios=5 → gratuito após 5, 10, 15 cortes...
        if (cortesReais > 0 && cortesReais % cfg.cortesNecessarios === 0) {
          clienteDoBarbeiro.proximoGratis = true;
        }

        // TODO: Supabase — atualizar cliente após conclusão
        // supabase.from('clientes')
        //   .update({ cortes: cortesReais, proximo_gratis: clienteDoBarbeiro.proximoGratis })
        //   .eq('telefone', ag.telefone)
      }
    }

    return d;
  });

  const cancelar = id => update(d => {
    // TODO: Supabase — supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    const a = d.agendamentos.find(x => x.id === id);
    if (a) a.status = "cancelado";
    return d;
  });

  return (
    <div>
      <div style={es.filtroBar}>
        {["todos","hoje","futuros","pendentes"].map(f => (
          <button key={f} className={`filter-btn ${filtro===f?"active":""}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      {lista.length === 0 && <div style={es.vazio}>Nenhum agendamento encontrado.</div>}
      {lista.map(ag => {
        const srv = dados.servicos?.find(s => s.id === ag.servicoId || s.id === ag.service);
        const cli = dados.clientes[ag.telefone || ag.phone];
        const dataObj = new Date((ag.data || ag.date) + "T12:00:00");
        // Quando admin, mostra o nome do barbeiro responsável por este agendamento
        const barbeiroDoAg = eAdmin
          ? dados.barbeiros?.find(b => b.id === ag.barbeiroId)
          : null;

        return (
          <div key={ag.id} style={{ ...es.agCard, opacity: ag.status==="cancelado"?0.5:1 }}>
            <div style={es.agEsquerda}>
              <div style={es.agData}>{dataObj.toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}</div>
              <div style={es.agHorario}>{ag.horario || ag.time}</div>
            </div>
            <div style={es.agMeio}>
              <div style={es.agNome}>{cli?.nome || formatarTelefone(ag.telefone || ag.phone || "")}</div>
              <div style={es.agServico}>
                {srv?.label || ag.servicoId}
                {ag.eGratis && <span style={es.badgeGratis}>GRÁTIS</span>}
                {ag.pagamento === "pix" && <span style={es.badgePix}>PIX ✓</span>}
              </div>
              {/* Admin: exibe o nome do barbeiro responsável pelo atendimento */}
              {barbeiroDoAg && (
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
                  ✂ {barbeiroDoAg.nome}
                </div>
              )}
            </div>
            <div style={es.agDireita}>
              <span style={{ ...es.badge, background: corStatus(ag.status) }}>{ag.status}</span>
              {ag.status === "agendado" && (
                <div style={{ display:"flex", gap:6, marginTop:8 }}>
                  <button className="btn-sm-success" onClick={() => concluir(ag.id)}>✓</button>
                  <button className="btn-sm-danger" onClick={() => cancelar(ag.id)}>✕</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA HORÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * AbaHorarios — configuração de horários do barbeiro logado.
 * Cada barbeiro tem agenda independente.
 */
function AbaHorarios({ dados, update, barbeiro }) {
  const alternar = (dia, horario) => update(d => {
    if (!d.horariosPorBarbeiro[barbeiro.id])
      d.horariosPorBarbeiro[barbeiro.id] = structuredClone(d.horariosGlobais);
    const cfg = d.horariosPorBarbeiro[barbeiro.id];
    if (!cfg[dia]) cfg[dia] = [];
    const idx = cfg[dia].indexOf(horario);
    if (idx > -1) cfg[dia].splice(idx, 1);
    else { cfg[dia].push(horario); cfg[dia].sort(); }
    return d;
  });

  const ativos = dia => dados.horariosPorBarbeiro?.[barbeiro.id]?.[dia] || dados.horariosGlobais?.[dia] || [];

  return (
    <div>
      <p style={es.cardSub}>Configure seus horários de atendimento. Clique para ativar/desativar.</p>
      {[1,2,3,4,5,6].map(dia => (
        <div key={dia} style={es.slotDia}>
          <h4 style={es.slotDiaNome}>{["","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][dia]}</h4>
          <div style={es.slotGrid}>
            {TODOS_HORARIOS.map(h => (
              <button key={h} className={`slot-toggle ${ativos(dia).includes(h)?"active":""}`} onClick={() => alternar(dia, h)}>{h}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA FIDELIDADE
// ─────────────────────────────────────────────────────────────

/**
 * AbaFidelidade — configuração do programa e visão real do progresso dos clientes.
 *
 * MUDANÇA CRÍTICA: o progresso agora é calculado a partir de
 * contarCortesReais() — apenas agendamentos com concluido===true contam.
 * O botão "+corte manual" foi removido pois criava uma brecha de fraude
 * onde o administrador poderia inflar contadores sem cortes reais.
 * Se necessário registrar um corte avulso, o barbeiro deve criar e
 * imediatamente concluir um agendamento via AbaAgenda.
 */
function AbaFidelidade({ dados, update }) {
  const cfg = dados.fidelidadeConfig;

  return (
    <div style={es.formCard}>
      <h3 style={es.cardTitulo}>⭐ Programa de Fidelidade</h3>

      {/* Toggle ativo/inativo */}
      <div style={es.toggleLinha}>
        <span style={es.rowLabel}>Ativar Fidelidade</span>
        <button className={`toggle ${cfg.ativo?"on":""}`} onClick={() => update(d => { d.fidelidadeConfig.ativo = !d.fidelidadeConfig.ativo; return d; })}>
          <span className="toggle-knob" />
        </button>
      </div>

      {cfg.ativo && (
        <>
          <div style={es.row}>
            <span style={es.rowLabel}>Cortes concluídos para ganhar 1 grátis</span>
            <div style={es.contador}>
              <button className="btn-sm" onClick={() => update(d => { if(d.fidelidadeConfig.cortesNecessarios>2) d.fidelidadeConfig.cortesNecessarios--; return d; })}>−</button>
              <span style={es.contadorValor}>{cfg.cortesNecessarios}</span>
              <button className="btn-sm" onClick={() => update(d => { d.fidelidadeConfig.cortesNecessarios++; return d; })}>+</button>
            </div>
          </div>
          <p style={es.cardSub}>
            A cada <strong>{cfg.cortesNecessarios}</strong> cortes <em>concluídos</em>, o próximo é gratuito.
            Apenas agendamentos marcados como concluídos pelo barbeiro contam.
          </p>
        </>
      )}

      {/* Progresso real de cada cliente */}
      <h3 style={{ ...es.sectionTitulo, marginTop:32 }}>Progresso dos Clientes</h3>
      <p style={{ ...es.cardSub, marginBottom:16 }}>
        Contagem baseada exclusivamente em cortes concluídos pelo barbeiro.
      </p>

      {Object.values(dados.clientes).map(c => {
        // Calcula cortes reais a partir dos agendamentos — não do campo denormalizado
        const cortesReais = contarCortesReais(dados.agendamentos, c.telefone);
        const progressoCiclo = cortesReais % cfg.cortesNecessarios;
        // Verifica gratuidade real (cortes concluídos atingiram o limiar)
        const temGratuidadeReal = c.proximoGratis &&
          cortesReais > 0 &&
          cortesReais % cfg.cortesNecessarios === 0;

        return (
          <div key={c.telefone} style={es.fidelidadeLinha}>
            <div style={{ flex:1 }}>
              <span style={es.agNome}>{c.nome || "—"}</span>
              <span style={{ ...es.cardSub, display:"block" }}>
                {formatarTelefone(c.telefone)} · {cortesReais} corte{cortesReais!==1?"s":""} concluídos
              </span>
              {/* Barra de progresso visual */}
              {cfg.ativo && (
                <div style={{ ...es.fidelidadeBar, marginTop:6, height:4 }}>
                  <div style={{
                    ...es.fidelidadeFill,
                    width:`${temGratuidadeReal ? 100 : (progressoCiclo/cfg.cortesNecessarios)*100}%`
                  }} />
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:12, flexShrink:0 }}>
              {temGratuidadeReal && <span style={es.badgeGratis}>GRÁTIS ✓</span>}
              {cfg.ativo && !temGratuidadeReal && (
                <span style={es.cardSub}>
                  {progressoCiclo}/{cfg.cortesNecessarios}
                </span>
              )}
              {/* Botão para redefinir gratuidade caso o cliente já tenha usado */}
              {c.proximoGratis && !temGratuidadeReal && (
                <button
                  className="btn-sm-danger"
                  title="Corrigir: marcar gratuidade como usada (os cortes reais não confirmam esta gratuidade)"
                  onClick={() => update(d => {
                    const cl = d.clientes[c.telefone];
                    if (cl) cl.proximoGratis = false;
                    return d;
                  })}
                >
                  Corrigir
                </button>
              )}
            </div>
          </div>
        );
      })}

      {Object.keys(dados.clientes).length === 0 && (
        <div style={es.vazio}>Nenhum cliente cadastrado ainda.</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA CLIENTES
// ─────────────────────────────────────────────────────────────

/** AbaClientes — busca e visualização de clientes. */
function AbaClientes({ dados }) {
  const [busca, setBusca] = useState("");
  const clientes = Object.values(dados.clientes).filter(c =>
    (c.nome||"").toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone||"").includes(busca.replace(/\D/g,""))
  );
  return (
    <div>
      <input style={es.input} placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
      {clientes.length===0 && <div style={es.vazio}>Nenhum cliente encontrado.</div>}
      {clientes.map(c => {
        const ags = dados.agendamentos.filter(a => a.telefone===c.telefone || a.phone===c.telefone);
        const concluidos = ags.filter(a => a.status==="concluído").length;
        return (
          <div key={c.telefone} style={es.clienteCard}>
            <div style={es.clienteTopo}>
              <div>
                <div style={es.agNome}>{c.nome||"Sem nome"}</div>
                <div style={es.cardSub}>{formatarTelefone(c.telefone)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={es.badge}>{concluidos} concluídos</span>
                {c.proximoGratis && <div><span style={es.badgeGratis}>PRÓXIMO GRÁTIS</span></div>}
              </div>
            </div>
            <div style={{ marginTop:8 }}>
              {ags.slice(-3).reverse().map(ag => {
                const srv = dados.servicos?.find(s => s.id===ag.servicoId||s.id===ag.service);
                return (
                  <div key={ag.id} style={es.miniAg}>
                    <span>{new Date((ag.data||ag.date)+"T12:00:00").toLocaleDateString("pt-BR")}</span>
                    <span>{ag.horario||ag.time}</span>
                    <span>{srv?.label||ag.servicoId}</span>
                    <span style={{ ...es.badge, background:corStatus(ag.status) }}>{ag.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA SERVIÇOS
// ─────────────────────────────────────────────────────────────

/**
 * AbaServicos — gerenciamento dinâmico de serviços e preços.
 * Permite adicionar, editar preço e remover serviços.
 */
function AbaServicos({ dados, update }) {
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");

  const adicionar = () => {
    if (!novoNome.trim() || !novoPreco) return;
    update(d => { d.servicos.push({ id:`svc_${Date.now()}`, label:novoNome.trim(), preco:parseFloat(novoPreco) }); return d; });
    setNovoNome(""); setNovoPreco("");
  };

  const remover = id => update(d => { d.servicos = d.servicos.filter(s => s.id!==id); return d; });

  const atualizarPreco = (id, val) => {
    const v = parseFloat(val); if(isNaN(v)) return;
    update(d => { const s = d.servicos.find(x => x.id===id); if(s) s.preco=v; return d; });
  };

  return (
    <div>
      <h3 style={es.cardTitulo}>💈 Serviços & Preços</h3>
      {dados.servicos?.map(s => (
        <div key={s.id} style={es.servicoLinha}>
          <span style={es.agNome}>{s.label}</span>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            <span style={es.cardSub}>R$</span>
            <input type="number" style={{ ...es.input, width:80, padding:"8px 10px", textAlign:"center" }}
              value={s.preco} min={0} onChange={e => atualizarPreco(s.id, e.target.value)} />
            <button className="btn-sm-danger" onClick={() => remover(s.id)}>✕</button>
          </div>
        </div>
      ))}
      <div style={{ ...es.formCard, marginTop:24 }}>
        <h4 style={{ ...es.sectionTitulo, marginBottom:16 }}>Adicionar Serviço</h4>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <input style={{ ...es.input, flex:2, minWidth:140 }} placeholder="Nome do serviço" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
          <input type="number" style={{ ...es.input, flex:1, minWidth:80 }} placeholder="Preço" value={novoPreco} min={0} onChange={e => setNovoPreco(e.target.value)} />
          <button className="btn-primary" style={{ minWidth:"auto", padding:"12px 20px" }} onClick={adicionar} disabled={!novoNome.trim()||!novoPreco}>
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA BARBEIROS
// ─────────────────────────────────────────────────────────────

/** AbaBarbeiros — gerenciamento da equipe de barbeiros. Exclusivo do Administrador. */
function AbaBarbeiros({ dados, update }) {
  const [novoNome, setNovoNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [erroBarbeiro, setErroBarbeiro] = useState("");

  /**
   * Adiciona novo barbeiro à equipe.
   * Valida: nome não pode ser duplicado, mínimo 2 chars, senha obrigatória.
   */
  const adicionar = () => {
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo || !novaSenha.trim()) return;

    // Validação: nome duplicado (case-insensitive)
    const nomeDuplicado = dados.barbeiros.some(
      b => b.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (nomeDuplicado) {
      setErroBarbeiro(`Já existe um barbeiro com o nome "${nomeLimpo}".`);
      return;
    }

    setErroBarbeiro("");
    update(d => {
      // TODO: Supabase — inserir barbeiro
      // supabase.from('barbeiros').insert({ nome: nomeLimpo, e_admin: false })
      // Senha deve ser criada via Supabase Auth, não armazenada em texto puro.
      d.barbeiros.push({ id: `b_${Date.now()}`, nome: nomeLimpo, senha: novaSenha.trim() });
      return d;
    });
    setNovoNome("");
    setNovaSenha("");
  };

  /**
   * Remove um barbeiro pelo id.
   * Proteção dupla: recusa remoção do administrador (id === "admin" ou eAdmin === true).
   * Nunca deve ser possível deletar o admin — nem por bug, nem por manipulação direta.
   */
  const remover = id => {
    const barbeiro = dados.barbeiros.find(b => b.id === id);
    if (!barbeiro || barbeiro.eAdmin || barbeiro.id === "admin") return;
    update(d => {
      // TODO: Supabase — remover barbeiro
      // supabase.from('barbeiros').delete().eq('id', id)
      d.barbeiros = d.barbeiros.filter(b => b.id !== id);
      return d;
    });
  };

  return (
    <div>
      <h3 style={es.cardTitulo}>✂️ Equipe de Barbeiros</h3>
      {dados.barbeiros?.map(b => (
        <div key={b.id} style={es.barbeiroLinha}>
          <span style={es.barbeiroAvatarPequeno}>{b.nome.charAt(0)}</span>
          <span style={es.agNome}>
            {b.nome}
            {/* Marca o Administrador visualmente — sem possibilidade de remoção */}
            {b.eAdmin && <span style={{ ...es.badgeGratis, marginLeft: 8 }}>👑 ADMIN</span>}
          </span>
          <span style={es.cardSub}>Senha: ••••</span>
          {/* Botão de remoção oculto para o administrador */}
          {!b.eAdmin && (
            <button className="btn-sm-danger" style={{ marginLeft:"auto" }} onClick={() => remover(b.id)}>
              Remover
            </button>
          )}
        </div>
      ))}
      <div style={{ ...es.formCard, marginTop:24 }}>
        <h4 style={{ ...es.sectionTitulo, marginBottom:16 }}>Adicionar Barbeiro</h4>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <input style={{ ...es.input, flex:2, minWidth:140 }} placeholder="Nome" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
          <input style={{ ...es.input, flex:1, minWidth:100 }} placeholder="Senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
          <button className="btn-primary" style={{ minWidth:"auto", padding:"12px 20px" }} onClick={adicionar} disabled={!novoNome.trim()||!novaSenha.trim()}>
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ABA QR CODE
// ─────────────────────────────────────────────────────────────

/**
 * AbaQRCode — exibe QR Codes de agendamento gerados localmente.
 * Usa QRCodeDisplay para renderização offline via qrcode.react.
 */
function AbaQRCode({ dados, barbeiro }) {
  const urlBase = window.location.origin + window.location.pathname;
  // Filtra admin da lista de barbeiros para exibição pública
  const barbeirosVisiveis = dados.barbeiros?.filter(b => !b.eAdmin) || [];

  return (
    <div>
      <h3 style={es.cardTitulo}>🔳 QR Codes de Agendamento</h3>
      <p style={es.cardSub}>Compartilhe para facilitar o agendamento dos clientes.</p>
      <div style={es.qrGrid}>
        {/* QR Code da barbearia geral */}
        <div style={es.qrCard}>
          <QRCodeDisplay url={urlBase} titulo="Barbearia Geral" tamanho={160} exibirUrl />
        </div>
        {/* QR Code do barbeiro logado (se não for admin) */}
        {!barbeiro.eAdmin && (
          <div style={es.qrCard}>
            <QRCodeDisplay
              url={`${urlBase}?barbeiro=${barbeiro.id}`}
              titulo={`Seu link — ${barbeiro.nome}`}
              tamanho={160}
              exibirUrl
            />
          </div>
        )}
      </div>
      {/* QR Codes individuais de todos os barbeiros (exceto admin) */}
      <h3 style={{ ...es.sectionTitulo, marginTop:32 }}>Todos os Barbeiros</h3>
      <div style={es.qrGrid}>
        {barbeirosVisiveis.map(b => (
          <div key={b.id} style={es.qrCard}>
            <QRCodeDisplay
              url={`${urlBase}?barbeiro=${b.id}`}
              titulo={b.nome}
              tamanho={140}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES REUTILIZÁVEIS
// ─────────────────────────────────────────────────────────────

/** Linha — par label/valor para tela de confirmação */
function Linha({ label, value, destaque }) {
  return (
    <div style={es.row}>
      <span style={es.rowLabel}>{label}</span>
      <span style={{ ...es.rowValor, color: destaque ? "var(--gold)" : "var(--text)" }}>{value}</span>
    </div>
  );
}

/**
 * BadgeFidelidade — exibe progresso real de fidelidade do cliente.
 *
 * IMPORTANTE: usa contarCortesReais() para exibir apenas cortes
 * efetivamente concluídos. Nunca exibe agendamentos futuros como progresso.
 *
 * @prop {object} cliente      — dados do cliente (telefone, nome, proximoGratis)
 * @prop {object} config       — fidelidadeConfig (ativo, cortesNecessarios)
 * @prop {Array}  agendamentos — lista completa para calcular cortes reais
 */
function BadgeFidelidade({ cliente, config, agendamentos = [] }) {
  if (!config.ativo || !cliente) return null;

  // Cortes reais = apenas agendamentos com concluido: true (não futuros)
  const cortesReais = contarCortesReais(agendamentos, cliente.telefone);
  const necessarios = config.cortesNecessarios;

  // Progresso dentro do ciclo atual (ex: 3 de 5)
  const progressoCiclo = cortesReais % necessarios;
  const porcentagem = (progressoCiclo / necessarios) * 100;

  // Gratuidade é real somente se os cortes reais confirmam
  const temGratuidade = cliente.proximoGratis && cortesReais > 0 && cortesReais % necessarios === 0;

  return (
    <div style={es.badgeFidelidade}>
      <div style={es.fidelidadeTopo}>
        <span style={es.fidelidadeTitulo}>✂ Fidelidade</span>
        {temGratuidade
          ? <span style={es.badgeGratis}>GRÁTIS DISPONÍVEL!</span>
          : <span style={es.fidelidadeContagem}>{progressoCiclo}/{necessarios} cortes concluídos</span>
        }
      </div>
      <div style={es.fidelidadeBar}>
        <div style={{ ...es.fidelidadeFill, width:`${temGratuidade ? 100 : porcentagem}%` }} />
      </div>
      {!temGratuidade && (
        <p style={es.fidelidadeSub}>
          Faltam <strong>{necessarios - progressoCiclo}</strong> corte{necessarios - progressoCiclo !== 1 ? "s" : ""} concluídos para o próximo gratuito!
        </p>
      )}
      {/* Informa o total acumulado para transparência */}
      <p style={{ ...es.fidelidadeSub, marginTop:4 }}>
        Total histórico: {cortesReais} corte{cortesReais !== 1 ? "s" : ""} realizados
      </p>
    </div>
  );
}

/**
 * ModalPix — exibe QR Code e código copiável para pagamento PIX.
 * prop inline=true → renderiza dentro da página sem overlay.
 */
function ModalPix({ codigo, valor, inline, onFechar }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(codigo).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  };
  const conteudo = (
    <div style={es.pixConteudo}>
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <span style={{ fontSize:32 }}>📱</span>
        <h3 style={{ ...es.cardTitulo, marginTop:8 }}>Pagamento PIX</h3>
        <p style={es.cardSub}>{valor > 0 ? `Valor: ${formatarPreco(valor)}` : "Corte gratuito — R$ 0,00"}</p>
      </div>
      {/* QR Code PIX renderizado localmente — sem rede externa */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
        <QRCodeDisplay url={codigo} tamanho={180} />
      </div>
      <div style={es.pixCodigo}>
        <span style={es.pixCodigoTexto}>{codigo.substring(0, 50)}...</span>
      </div>
      <button className="btn-primary" style={{ width:"100%", marginTop:12 }} onClick={copiar}>
        {copiado ? "✓ Copiado!" : "Copiar código PIX"}
      </button>
      {onFechar && <button className="btn-ghost" style={{ width:"100%", marginTop:10 }} onClick={onFechar}>Fechar</button>}
    </div>
  );
  if (inline) return <div style={{ ...es.formCard, marginTop:16 }}>{conteudo}</div>;
  return (
    <div style={es.modalOverlay} onClick={onFechar}>
      <div style={es.modalBox} onClick={e => e.stopPropagation()}>{conteudo}</div>
    </div>
  );
}

/**
 * ModalQRCode — modal com QR Codes exibido na tela inicial.
 * Usa QRCodeDisplay para renderização offline.
 * Não exibe QR Code do admin (perfil interno).
 */
function ModalQRCode({ dados, onFechar }) {
  const urlBase = window.location.origin + window.location.pathname;
  const barbeirosVisiveis = dados.barbeiros?.filter(b => !b.eAdmin) || [];

  return (
    <div style={es.modalOverlay} onClick={onFechar}>
      <div style={{ ...es.modalBox, maxWidth:500 }} onClick={e => e.stopPropagation()}>
        <h3 style={es.cardTitulo}>🔳 QR Codes</h3>
        <p style={es.cardSub}>Compartilhe para facilitar o agendamento</p>
        <div style={es.qrGrid}>
          <div style={es.qrCard}>
            <QRCodeDisplay url={urlBase} titulo="Geral" tamanho={140} />
          </div>
          {barbeirosVisiveis.map(b => (
            <div key={b.id} style={es.qrCard}>
              <QRCodeDisplay
                url={`${urlBase}?barbeiro=${b.id}`}
                titulo={b.nome}
                tamanho={140}
              />
            </div>
          ))}
        </div>
        <button className="btn-ghost" style={{ width:"100%", marginTop:16 }} onClick={onFechar}>Fechar</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ESTILOS (objeto es)
// ─────────────────────────────────────────────────────────────

const es = {
  root: { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--font-body)" },
  home: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" },
  homeBg: { position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 50%, #1a0a00 0%, #0a0a0a 60%, #0d0d12 100%)", zIndex:0 },
  homeContent: { position:"relative", zIndex:1, textAlign:"center", padding:"0 24px", width:"100%", maxWidth:400 },
  logoWrap: { marginBottom:40 },
  logoTesoura: { fontSize:48, display:"block", marginBottom:8, filter:"drop-shadow(0 0 20px var(--gold))" },
  logoTexto: { fontFamily:"var(--font-display)", fontSize:"clamp(36px,8vw,64px)", fontWeight:700, letterSpacing:"0.1em", color:"var(--text)", margin:0 },
  logoDestaque: { color:"var(--gold)" },
  logoSub: { fontFamily:"var(--font-body)", fontSize:13, letterSpacing:"0.4em", color:"var(--muted)", marginTop:8, textTransform:"uppercase" },
  homeBotoes: { display:"flex", flexDirection:"column", gap:12, alignItems:"center" },
  barbeiroRapido: { marginTop:28, borderTop:"1px solid var(--border)", paddingTop:20 },
  barbeiroRapidoTitulo: { fontSize:12, color:"var(--muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 },
  barbeiroRapidoGrid: { display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" },
  homeDecor: { position:"absolute", bottom:32, display:"flex", alignItems:"center", gap:16, zIndex:1 },
  decorLinha: { width:60, height:1, background:"var(--muted)" },
  decorTexto: { fontSize:11, letterSpacing:"0.4em", color:"var(--muted)" },
  panel: { minHeight:"100vh", display:"flex", flexDirection:"column" },
  panelHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid var(--border)", background:"var(--surface)" },
  panelTitulo: { fontFamily:"var(--font-display)", fontSize:18, fontWeight:700, margin:0, color:"var(--text)" },
  progressoWrap: { display:"flex", gap:6 },
  progressoPonto: { width:8, height:8, borderRadius:"50%", transition:"background .3s" },
  panelBody: { flex:1, padding:"20px 16px", overflowY:"auto" },
  tabBar: { display:"flex", overflowX:"auto", borderBottom:"1px solid var(--border)", background:"var(--surface)", padding:"0 8px" },
  formCard: { background:"var(--surface)", borderRadius:16, padding:24, border:"1px solid var(--border)", maxWidth:480, margin:"0 auto" },
  cardTitulo: { fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, margin:"0 0 8px", color:"var(--text)" },
  cardSub: { color:"var(--muted)", fontSize:14, margin:"0 0 8px", lineHeight:1.5 },
  input: { width:"100%", padding:"14px 16px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:16, boxSizing:"border-box", outline:"none", fontFamily:"var(--font-body)" },
  section: { marginBottom:24 },
  sectionTitulo: { fontFamily:"var(--font-display)", fontSize:14, fontWeight:600, marginBottom:12, color:"var(--muted-light)", textTransform:"uppercase", letterSpacing:"0.1em" },
  barbeiroGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px,1fr))", gap:10, marginBottom:16 },
  barbeiroAvatarGrande: { display:"block", width:48, height:48, borderRadius:"50%", background:"var(--gold)", color:"#000", fontSize:22, fontWeight:800, lineHeight:"48px", textAlign:"center", margin:"0 auto 8px" },
  barbeiroNome: { display:"block", fontSize:14, fontWeight:600 },
  barbeiroAvatarPequeno: { display:"inline-flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:"50%", background:"var(--gold)", color:"#000", fontSize:15, fontWeight:800, flexShrink:0 },
  barbeiroConfirmado: { display:"flex", alignItems:"center", gap:10, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:16 },
  barbeiroAvatar: { display:"inline-flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:"50%", background:"var(--gold)", color:"#000", fontSize:13, fontWeight:800 },
  servicoGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  servicoLabel: { display:"block", fontWeight:600, fontSize:15 },
  servicoPreco: { display:"block", color:"var(--gold)", fontSize:13, marginTop:4 },
  servicoLinha: { display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid var(--border)" },
  diaGrid: { display:"flex", gap:8, overflowX:"auto", paddingBottom:4 },
  diaNome: { display:"block", fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em" },
  diaNumero: { display:"block", fontSize:22, fontWeight:700, marginTop:2 },
  horarioGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))", gap:8 },
  confirmCard: { background:"var(--surface2)", borderRadius:12, padding:16 },
  row: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" },
  rowLabel: { color:"var(--muted)", fontSize:14 },
  rowValor: { fontWeight:600, fontSize:15 },
  pagamentoOpcoes: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:16 },
  pagamentoIcone: { display:"block", fontSize:32, marginBottom:8 },
  pagamentoLabel: { display:"block", fontWeight:700, fontSize:15 },
  pagamentoSub: { display:"block", color:"var(--muted)", fontSize:13, marginTop:4 },
  iconeSuccesso: { width:64, height:64, borderRadius:"50%", background:"var(--gold)", color:"#000", fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontWeight:700 },
  badgeFidelidade: { background:"linear-gradient(135deg,#1a1200,#2a1f00)", border:"1px solid var(--gold)", borderRadius:12, padding:16, marginTop:20 },
  fidelidadeTopo: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  fidelidadeTitulo: { fontWeight:700, color:"var(--gold)", fontSize:14 },
  fidelidadeContagem: { color:"var(--muted)", fontSize:13 },
  fidelidadeBar: { height:6, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden" },
  fidelidadeFill: { height:"100%", background:"var(--gold)", borderRadius:3, transition:"width .5s ease" },
  fidelidadeSub: { color:"var(--muted)", fontSize:12, margin:"8px 0 0" },
  fidelidadeLinha: { display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid var(--border)", flexWrap:"wrap" },
  filtroBar: { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
  agCard: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:14, marginBottom:10, display:"flex", gap:12, alignItems:"flex-start" },
  agEsquerda: { minWidth:52, textAlign:"center" },
  agData: { fontSize:12, color:"var(--muted)" },
  agHorario: { fontSize:18, fontWeight:700, color:"var(--gold)", fontFamily:"var(--font-display)" },
  agMeio: { flex:1 },
  agNome: { fontWeight:600, fontSize:15 },
  agServico: { color:"var(--muted)", fontSize:13, marginTop:2 },
  agDireita: { textAlign:"right" },
  badge: { fontSize:11, padding:"3px 8px", borderRadius:20, background:"#334155", color:"#fff", fontWeight:600, display:"inline-block" },
  badgeGratis: { fontSize:11, padding:"2px 7px", borderRadius:20, background:"var(--gold)", color:"#000", fontWeight:800, marginLeft:6 },
  badgePix: { fontSize:11, padding:"2px 7px", borderRadius:20, background:"#16a34a", color:"#fff", fontWeight:700, marginLeft:6 },
  slotDia: { marginBottom:20 },
  slotDiaNome: { fontFamily:"var(--font-display)", fontSize:16, marginBottom:8, color:"var(--muted-light)" },
  slotGrid: { display:"flex", flexWrap:"wrap", gap:6 },
  toggleLinha: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", borderBottom:"1px solid var(--border)" },
  contador: { display:"flex", alignItems:"center", gap:12 },
  contadorValor: { fontSize:20, fontWeight:700, minWidth:32, textAlign:"center" },
  clienteCard: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:12 },
  clienteTopo: { display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  miniAg: { display:"flex", gap:12, fontSize:13, color:"var(--muted)", padding:"6px 0", borderBottom:"1px solid var(--border)", flexWrap:"wrap" },
  barbeiroLinha: { display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid var(--border)" },
  barraBoasVindas: { background:"#052e16", border:"1px solid #16a34a", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#86efac", fontSize:14 },
  barraGratis: { background:"#1a1200", border:"1px solid var(--gold)", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"var(--gold)", fontSize:14 },
  qrGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:16, marginTop:16 },
  qrCard: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, textAlign:"center" },
  qrImagem: { width:"100%", maxWidth:160, borderRadius:8 },
  qrUrl: { fontSize:10, color:"var(--muted)", marginTop:8, wordBreak:"break-all" },
  pixConteudo: { padding:"0 4px" },
  pixCodigo: { background:"var(--surface2)", borderRadius:8, padding:"10px 12px", border:"1px solid var(--border)", wordBreak:"break-all" },
  pixCodigoTexto: { fontSize:11, color:"var(--muted-light)", fontFamily:"monospace" },
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modalBox: { background:"var(--surface)", borderRadius:20, padding:24, border:"1px solid var(--border)", width:"100%", maxWidth:400, maxHeight:"90vh", overflowY:"auto" },
  vazio: { textAlign:"center", color:"var(--muted)", padding:"40px 0", fontSize:15 },
  erro: { color:"#f87171", fontSize:14, marginTop:8 },
};

// ─────────────────────────────────────────────────────────────
// CSS GLOBAL
// ─────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
  :root {
    --bg:#0a0a0a; --surface:#111111; --surface2:#1a1a1a; --border:#2a2a2a;
    --text:#f5f0eb; --muted:#6b6560; --muted-light:#9e9890;
    --gold:#c9a84c; --gold-light:#e8c97a;
    --font-display:'Playfair Display',serif; --font-body:'DM Sans',sans-serif;
  }
  * { box-sizing:border-box; } body { margin:0; }
  .fade-in { animation:fadeIn .35s ease; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

  .btn-primary { display:flex;align-items:center;justify-content:center;padding:14px 28px;background:var(--gold);color:#0a0a0a;font-family:var(--font-body);font-weight:700;font-size:15px;border:none;border-radius:10px;cursor:pointer;transition:background .2s,transform .1s;letter-spacing:.03em;min-width:200px; }
  .btn-primary:hover:not(:disabled){background:var(--gold-light);transform:translateY(-1px)}
  .btn-primary:disabled{opacity:.4;cursor:not-allowed}
  .btn-ghost{padding:12px 24px;background:transparent;color:var(--muted-light);font-family:var(--font-body);font-size:14px;font-weight:500;border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:border-color .2s,color .2s;letter-spacing:.03em}
  .btn-ghost:hover{border-color:var(--muted);color:var(--text)}
  .btn-back{background:none;border:none;color:var(--muted);cursor:pointer;font-family:var(--font-body);font-size:14px;padding:4px 0}
  .btn-back:hover{color:var(--text)}
  .btn-sm{padding:6px 12px;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:16px}
  .btn-sm-success{padding:5px 10px;background:#052e16;color:#86efac;border:1px solid #16a34a;border-radius:8px;cursor:pointer;font-size:13px}
  .btn-sm-danger{padding:5px 10px;background:#2d0a0a;color:#fca5a5;border:1px solid #dc2626;border-radius:8px;cursor:pointer;font-size:13px}

  .service-card{padding:14px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;cursor:pointer;text-align:left;color:var(--text);transition:border-color .2s,background .2s}
  .service-card:hover{border-color:var(--muted)} .service-card.active{border-color:var(--gold);background:#1a1500}
  .day-card{min-width:56px;padding:10px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;cursor:pointer;text-align:center;color:var(--text);transition:border-color .2s,background .2s}
  .day-card.active{border-color:var(--gold);background:#1a1500}
  .time-slot{padding:10px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;cursor:pointer;color:var(--text);font-size:14px;transition:all .2s}
  .time-slot.active{background:var(--gold);color:#000;border-color:var(--gold);font-weight:700}
  .time-slot:hover:not(.active){border-color:var(--muted)}

  .barbeiro-card{padding:16px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:14px;cursor:pointer;text-align:center;color:var(--text);transition:border-color .2s,background .2s}
  .barbeiro-card:hover{border-color:var(--muted)} .barbeiro-card.active{border-color:var(--gold);background:#1a1500}
  .btn-barbeiro{display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--surface);border:1px solid var(--border);border-radius:40px;cursor:pointer;color:var(--text);font-size:14px;font-family:var(--font-body);font-weight:500;transition:border-color .2s,background .2s}
  .btn-barbeiro:hover{border-color:var(--gold);background:#1a1500}
  .pagamento-card{padding:20px 14px;background:var(--surface2);border:2px solid var(--border);border-radius:14px;cursor:pointer;text-align:center;color:var(--text);transition:all .2s}
  .pagamento-card:hover{border-color:var(--muted)} .pagamento-card.active{border-color:var(--gold);background:#1a1500}

  .tab-btn{padding:12px 12px;background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);cursor:pointer;font-family:var(--font-body);font-size:12px;white-space:nowrap;transition:color .2s,border-color .2s}
  .tab-btn.active{color:var(--gold);border-bottom-color:var(--gold)}
  .filter-btn{padding:7px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;color:var(--muted);font-size:13px;cursor:pointer;transition:all .2s}
  .filter-btn.active{background:var(--gold);color:#000;border-color:var(--gold);font-weight:700}
  .slot-toggle{padding:6px 10px;font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--muted);cursor:pointer;transition:all .2s}
  .slot-toggle.active{background:#1a1500;border-color:var(--gold);color:var(--gold);font-weight:600}

  .toggle{width:48px;height:26px;border-radius:13px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;position:relative;transition:background .3s;padding:0}
  .toggle.on{background:var(--gold);border-color:var(--gold)}
  .toggle-knob{display:block;width:20px;height:20px;background:var(--muted);border-radius:50%;position:absolute;top:2px;left:2px;transition:transform .3s,background .3s}
  .toggle.on .toggle-knob{transform:translateX(22px);background:#000}

  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
`;
