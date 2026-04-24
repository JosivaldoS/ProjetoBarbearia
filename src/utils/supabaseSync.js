// import { supabase } from './supabase'; // Desativado para eliminar demora no carregamento

const STORAGE_KEY = "barbearia_data";

export const defaultData = {
  clients: {},
  appointments: [],
  availableSlots: {
    1: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    2: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    3: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    4: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    5: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    6: ["09:00","09:30","10:00","10:30","11:00"],
  },
  loyaltyConfig: {
    enabled: true,
    cutsRequired: 5,
  },
  barberPassword: "1234",
};

// Carrega dados do localStorage - versão ultra rápida sem Supabase
export async function loadData() {
  try {
    // Carrega diretamente do localStorage sem nenhuma tentativa de conexão externa
    const raw = localStorage.getItem(STORAGE_KEY);
    const localData = raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
    
    console.log('ðŸ’» Dados carregados do localStorage (modo offline)');
    return localData;
  } catch {
    console.log('â¤ï¸ Erro ao carregar localStorage, usando dados padrão');
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
