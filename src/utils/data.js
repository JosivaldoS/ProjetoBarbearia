// Importa as funções de sincronização com Supabase
export { loadData, saveData } from './supabaseSync';

export const STORAGE_KEY = "barbearia_data";

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
