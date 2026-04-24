import { useState } from "react";
import { formatPhone, SERVICES, statusColor } from "../../utils/data";
import "./ClientsTab.css";

/**
 * Componente que exibe e gerencia a lista de clientes
 * Permite buscar clientes por telefone e visualizar histórico de agendamentos
 * 
 * @param {Object} dados - Dados globais da aplicação contendo clientes e agendamentos
 */
export default function ClientsTab({ dados }) {
  // Estado para controlar o termo de busca por telefone
  const [buscaTelefone, setBuscaTelefone] = useState("");
  
  /**
   * Filtra os clientes com base no telefone digitado
   * Remove caracteres não numéricos para facilitar a busca
   */
  const clientesFiltrados = Object.values(dados.clients).filter((cliente) =>
    cliente.phone.includes(buscaTelefone.replace(/\D/g, ""))
  );

  return (
    <div>
      {/* Campo de busca por telefone */}
      <input
        className="input"
        placeholder="Buscar por telefone..."
        value={buscaTelefone}
        onChange={(e) => setBuscaTelefone(e.target.value)}
      />
      
      {/* Mensagem quando nenhum cliente é encontrado */}
      {clientesFiltrados.length === 0 && <div className="empty">Nenhum cliente encontrado.</div>}
      
      {/* Lista de clientes com seus históricos */}
      {clientesFiltrados.map((cliente) => {
        // Filtra agendamentos deste cliente específico
        const agendamentosCliente = dados.appointments.filter((agendamento) => agendamento.phone === cliente.phone);
        
        // Conta apenas agendamentos concluídos
        const concluidos = agendamentosCliente.filter((agendamento) => agendamento.status === "concluído").length;
        return (
          // Card individual do cliente com informações e histórico
          <div key={cliente.phone} className="client-card">
            <div className="client-top">
              <span className="ap-phone">{formatPhone(cliente.phone)}</span>
              <span className="badge">{concluidos} concluídos</span>
            </div>
            <div className="client-meta">
              <span className="card-sub">Total de cortes: {cliente.cuts || 0}</span>
              {cliente.freeNext && <span className="free-badge">PRÓXIMO GRÁTIS</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              {/* Exibe os últimos 3 agendamentos do cliente em ordem reversa */}
              {agendamentosCliente.slice(-3).reverse().map((agendamento) => (
                <div key={agendamento.id} className="mini-ap">
                  <span>{new Date(`${agendamento.date}T12:00:00`).toLocaleDateString('pt-BR')}</span>
                  <span>{agendamento.time}</span>
                  <span>{SERVICES.find((servico) => servico.id === agendamento.service)?.label}</span>
                  <span className="badge" style={{ background: statusColor(agendamento.status) }}>{agendamento.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
