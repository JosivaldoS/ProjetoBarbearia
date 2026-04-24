import { useState } from "react";
import { formatPhone, statusColor } from "../../utils/data";
import "./ClientsTab.css";

/**
 * AbaClientes — lista e busca clientes, exibe histórico de agendamentos.
 */
export default function ClientsTab({ dados }) {
  const [busca, setBusca] = useState("");

  const filtrados = Object.values(dados.clientes).filter(c =>
    c.telefone.includes(busca.replace(/\D/g, ""))
  );

  return (
    <div>
      <input className="input" placeholder="Buscar por telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
      {filtrados.length === 0 && <div className="empty">Nenhum cliente encontrado.</div>}
      {filtrados.map(c => {
        const ags = dados.agendamentos.filter(a => (a.telefone || a.phone) === c.telefone);
        const concluidos = ags.filter(a => a.status === "concluído").length;
        return (
          <div key={c.telefone} className="client-card">
            <div className="client-top">
              <span className="ap-phone">{c.nome || formatPhone(c.telefone)}</span>
              <span className="badge">{concluidos} concluídos</span>
            </div>
            <div className="client-meta">
              <span className="card-sub">Cortes (histórico): {c.cortes || 0}</span>
              {c.proximoGratis && <span className="free-badge">PRÓXIMO GRÁTIS</span>}
            </div>
            <div style={{ marginTop:8 }}>
              {ags.slice(-3).reverse().map(a => {
                const srv = dados.servicos?.find(s => s.id === a.servicoId || s.id === a.service);
                return (
                  <div key={a.id} className="mini-ap">
                    <span>{new Date((a.data || a.date) + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    <span>{a.horario || a.time}</span>
                    <span>{srv?.label || a.servicoId}</span>
                    <span className="badge" style={{ background: statusColor(a.status) }}>{a.status}</span>
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
