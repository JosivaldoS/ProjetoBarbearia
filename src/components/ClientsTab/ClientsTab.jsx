import { useState } from "react";
import { formatPhone, SERVICES, statusColor } from "../../utils/data";
import "./ClientsTab.css";

export default function ClientsTab({ data }) {
  // Essa função funciona assim: o usuário digita um número de telefone, e a gente filtra os clientes para mostrar apenas os que têm aquele número (ou parte dele) no telefone. A gente remove tudo que não é dígito do input para facilitar a busca, já que os telefones são armazenados só com números.
  
  const [search, setSearch] = useState("");
  const clients = Object.values(data.clients).filter((c) =>
    c.phone.includes(search.replace(/\D/g, ""))
  );

  return (
    <div>
      <input
        className="input"
        placeholder="Buscar por telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {clients.length === 0 && <div className="empty">Nenhum cliente encontrado.</div>}
      {clients.map((c) => {
        const appts = data.appointments.filter((a) => a.phone === c.phone);
        const done = appts.filter((a) => a.status === "concluído").length;
        return (
          // Aqui usamos o telefone como chave, mas em um cenário real, seria melhor usar um ID único para cada cliente
          <div key={c.phone} className="client-card">
            <div className="client-top">
              <span className="ap-phone">{formatPhone(c.phone)}</span>
              <span className="badge">{done} concluídos</span>
            </div>
            <div className="client-meta">
              <span className="card-sub">Total de cortes: {c.cuts || 0}</span>
              {c.freeNext && <span className="free-badge">PRÓXIMO GRÁTIS</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              {appts.slice(-3).reverse().map((a) => (
                <div key={a.id} className="mini-ap">
                  <span>{new Date(`${a.date}T12:00:00`).toLocaleDateString('pt-BR')}</span>
                  <span>{a.time}</span>
                  <span>{SERVICES.find((s) => s.id === a.service)?.label}</span>
                  <span className="badge" style={{ background: statusColor(a.status) }}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
