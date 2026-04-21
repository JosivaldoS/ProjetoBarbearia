import { supabase } from './supabase';

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

// Carrega dados do localStorage (fallback) e tenta sincronizar com Supabase
export async function loadData() {
  try {
    // Carrega do localStorage como fallback
    const raw = localStorage.getItem(STORAGE_KEY);
    const localData = raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
    
    // Tenta carregar agendamentos do Supabase
    try {
      const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select('*');
      
      if (error) throw error;
      
      // Converte dados do Supabase para o formato esperado
      if (appointments && Array.isArray(appointments)) {
        localData.appointments = appointments.map(apt => ({
          id: apt.id,
          phone: apt.phone || '',
          date: apt.data, // Supabase tem 'data', app usa 'date'
          time: apt.hora, // Supabase tem 'hora', app usa 'time'
          service: apt.service || '',
          status: apt.status || 'agendado',
          isFree: apt.isFree || false,
        }));
        
        // Marca todos os IDs do Supabase como sincronizados
        const syncedKey = "barbearia_synced";
        const syncedIds = appointments.map(apt => String(apt.id));
        localStorage.setItem(syncedKey, JSON.stringify(syncedIds));
        
        console.log('✅ Agendamentos carregados do Supabase:', localData.appointments);
      }
    } catch (supabaseError) {
      console.warn('⚠️ Erro ao sincronizar com Supabase:', supabaseError);
      // Continua com dados do localStorage
    }
    
    return localData;
  } catch {
    return defaultData;
  }
}

// Salva dados - tanto localStorage quanto Supabase
export async function saveData(d) {
  // Salva no localStorage (fallback)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  
  // Sincroniza agendamentos com Supabase
  try {
    const appointments = d.appointments || [];
    const syncedKey = "barbearia_synced";
    const statusCacheKey = "barbearia_status_cache";
    
    console.log('📊 saveData chamado com', appointments.length, 'agendamentos');
    
    let syncedIds = new Set();
    let statusCache = {};
    
    try {
      const raw = localStorage.getItem(syncedKey);
      if (raw) syncedIds = new Set(JSON.parse(raw));
    } catch {}
    
    try {
      const raw = localStorage.getItem(statusCacheKey);
      if (raw) statusCache = JSON.parse(raw);
    } catch {}
    
    console.log('🔍 Status cache atual:', statusCache);
    
    for (const apt of appointments) {
      const aptIdStr = String(apt.id);
      console.log(`\n📌 Processando agendamento ${apt.id} (status: ${apt.status})`);
      
      // Para agendamentos do Supabase (ID pequeno), faz UPDATE se status mudou ou não foi sincronizado
      if (apt.id < 1000000) {
        console.log(`✅ ID ${apt.id} é do Supabase (< 1000000)`);
        const lastKnownStatus = statusCache[aptIdStr];
        const needsUpdate = !lastKnownStatus || lastKnownStatus !== apt.status;
        
        console.log(`  Status anterior: ${lastKnownStatus || 'nunca sincronizado'}`);
        console.log(`  Precisa atualizar? ${needsUpdate}`);
        
        if (needsUpdate) {
          console.log(`🔄 Atualizando agendamento ${apt.id} para: ${apt.status}`);
          const { error: updateError } = await supabase
            .from('agendamentos')
            .update({ status: apt.status })
            .eq('id', apt.id);
          
          if (updateError) {
            console.error('❌ Erro ao atualizar agendamento:', updateError);
          } else {
            console.log(`✅ Agendamento ${apt.id} atualizado para: ${apt.status}`);
            statusCache[aptIdStr] = apt.status;
            localStorage.setItem(statusCacheKey, JSON.stringify(statusCache));
          }
        }
        continue;
      }

      // Pula agendamentos que já foram sincronizados (INSERT)
      if (syncedIds.has(aptIdStr)) {
        console.log(`⏭️ Agendamento ${apt.id} já foi sincronizado (INSERT)`);
        statusCache[aptIdStr] = apt.status;
        continue;
      }

      // Busca o nome do cliente a partir do phone
      const client = d.clients?.[apt.phone] || {};
      const clientName = client.name || `Cliente ${apt.phone}`;
      
      const payload = {
        nome: clientName,
        data: apt.date,
        hora: apt.time,
        phone: apt.phone,
        service: apt.service || '',
        status: apt.status || 'agendado',
        isFree: apt.isFree || false,
      };

      // Insere apenas agendamentos locais (ID grande = Date.now())
      if (apt.id && typeof apt.id === 'number' && apt.id > 1000000) {
        console.log(`📝 ID ${apt.id} é local (> 1000000), inserindo...`);
        const { error: insertError } = await supabase
          .from('agendamentos')
          .insert(payload);
        
        if (insertError) {
          console.error('❌ Erro ao inserir agendamento:', insertError);
        } else {
          console.log('✅ Agendamento inserido:', payload);
          syncedIds.add(aptIdStr);
          statusCache[aptIdStr] = apt.status;
          localStorage.setItem(syncedKey, JSON.stringify([...syncedIds]));
          localStorage.setItem(statusCacheKey, JSON.stringify(statusCache));
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro geral ao salvar em Supabase:', error);
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
