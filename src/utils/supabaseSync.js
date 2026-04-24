// import { supabase } from './supabase'; // Desativado para eliminar demora no carregamento
import { defaultData } from './data';

const STORAGE_KEY = "barbearia_data";

/**
 * Carrega dados do localStorage com migração automática de v1 → v2 → v3
 * Sistema de migração garante compatibilidade com dados salvos em versões anteriores
 */
export async function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    
    const salvo = JSON.parse(raw);

    // Migração: loyaltyConfig → fidelidadeConfig
    const fidelidadeConfig = salvo.fidelidadeConfig || (salvo.loyaltyConfig
      ? { ativo: salvo.loyaltyConfig.enabled, cortesNecessarios: salvo.loyaltyConfig.cutsRequired }
      : defaultData.fidelidadeConfig);

    // Migração: availableSlots → horariosGlobais
    const horariosGlobais = salvo.horariosGlobais || salvo.availableSlots || defaultData.horariosGlobais;

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
      ...defaultData, ...salvo,
      fidelidadeConfig, horariosGlobais, clientes, agendamentos,
      // Garante que o admin sempre existe — mesmo em dados salvos antes desta versão
      barbeiros: (() => {
        const lista = salvo.barbeiros || defaultData.barbeiros;
        const temAdmin = lista.some(b => b.id === "admin");
        if (!temAdmin) return [defaultData.barbeiros[0], ...lista]; // injeta admin no topo
        return lista;
      })(),
      servicos: salvo.servicos || defaultData.servicos,
      horariosPorBarbeiro: salvo.horariosPorBarbeiro || {},
    };
  } catch {
    console.log('❌ Erro ao carregar localStorage, usando dados padrão');
    return defaultData;
  }
}

// Salva dados - versão ultra rápida usando apenas localStorage
export async function saveData(d) {
  try {
    // Salva diretamente no localStorage sem nenhuma tentativa de conexão externa
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    console.log('ðŸ’» Dados salvos no localStorage (modo offline)');
  } catch (error) {
    console.error('â¤ï¸ Erro ao salvar dados:', error);
  }
}

// Função auxiliar para deletar agendamento do Supabase
export async function deleteAppointment(id) {
  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
  }
}

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
  return "#6b7280";
}
