import { useState } from "react";
import { styles } from "../styles";
import { formatPhone, SERVICES, statusColor } from "../utils/data";

export default function ClientsTab({ data }) {
  const [search, setSearch] = useState("");
  const clients = Object.values(data.clients).filter((c) =>
    c.phone.includes(search.replace(/\D/g, ""))
  );

  return (
    <div>
      <input
        style={styles.input}
        placeholder="Buscar por telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {clients.length === 0 && <div style={styles.empty}>Nenhum cliente encontrado.</div>}
      {clients.map((c) => {
        const appts = data.appointments.filter((a) => a.phone === c.phone);
        const done = appts.filter((a) => a.status === "concluído").length;
        return (
          <div key={c.phone} style={styles.clientCard}>
            <div style={styles.clientTop}>
              <span style={styles.apPhone}>{formatPhone(c.phone)}</span>
              <span style={styles.badge}>{done} concluídos</span>
            </div>
            <div style={styles.clientMeta}>
              <span style={styles.cardSub}>Total de cortes: {c.cuts || 0}</span>
              {c.freeNext && <span style={styles.freeBadge}>PRÓXIMO GRÁTIS</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              {appts.slice(-3).reverse().map((a) => (
                <div key={a.id} style={styles.miniAp}>
                  <span>{new Date(`${a.date}T12:00:00`).toLocaleDateString('pt-BR')}</span>
                  <span>{a.time}</span>
                  <span>{SERVICES.find((s) => s.id === a.service)?.label}</span>
                  <span style={{ ...styles.badge, background: statusColor(a.status) }}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
