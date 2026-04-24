// Importa as funções de sincronização com Supabase
export { loadData, saveData } from './supabaseSync';

export const STORAGE_KEY = "barbearia_data";

/**
 * Dados padrão da aplicação
 * Estrutura atualizada para suportar multi-barbeiros, serviços dinâmicos e fidelidade melhorada
 */
export const defaultData = {
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

// TODO: Remover SERVICES após migração completa - usar dados.servicos em vez disso
// Mantido temporariamente para compatibilidade durante transição
export const SERVICES = [
  { id: "corte", label: "Corte", price: "R$ 35" },
  { id: "barba", label: "Barba", price: "R$ 25" },
  { id: "corte_barba", label: "Corte + Barba", price: "R$ 55" },
  { id: "degradê", label: "Degradê", price: "R$ 40" },
];

export function formatPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function next7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dateKey(d) {
  return d.toISOString().split("T")[0];
}

export function statusColor(s) {
  if (s === "agendado") return "#2563eb";
  if (s === "concluído") return "#16a34a";
  if (s === "cancelado") return "#dc2626";
  if (s === "pago") return "#c9a84c";
  return "#6b7280";
}

/**
 * Formata valor numérico em reais: 35 → "R$ 35,00"
 */
export function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

/**
 * Gera um código PIX falso para fins de simulação.
 * Em produção: integrar com API de pagamentos real (ex: OpenPix, Efí Bank).
 * 
 * Correção aplicada: padStart era 6 dígitos e estourava com valores > R$99,99.
 * Agora usa 10 dígitos para suportar valores até R$999.999,99.
 */
export function gerarCodigoPix(valor, nome) {
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
export function validarTelefone(telefoneBruto) {
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
export function verificarAgendamentoDuplicado(agendamentos, barbeiroId, data, horario) {
  return agendamentos.some(
    a =>
      a.barbeiroId === barbeiroId &&
      a.data === data &&
      a.horario === horario &&
      a.status !== "cancelado"
  );
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
export function contarCortesReais(agendamentos, telefone) {
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
export function calcularProximoGratis(agendamentos, telefone, cortesNecessarios) {
  const cortesReais = contarCortesReais(agendamentos, telefone);
  // Só ativa após pelo menos um ciclo completo (ex: 5, 10, 15...)
  return cortesReais > 0 && cortesReais % cortesNecessarios === 0;
}
