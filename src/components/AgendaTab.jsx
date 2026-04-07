import { useState } from "react";
import { SERVICES, dateKey, formatPhone, statusColor } from "../utils/data";
import { styles } from "../styles";

export default function AgendaTab({ data, update }) {
  const [filter, setFilter] = useState("todos");
  const today = dateKey(new Date());

  let apps = [...data.appointments].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  if (filter === "hoje") apps = apps.filter((a) => a.date === today);
  if (filter === "pendentes") apps = apps.filter((a) => a.status === "agendado");
  if (filter === "futuros") apps = apps.filter((a) => a.date >= today);

  const cancel = (id) =>
    update((d) => {
      const ap = d.appointments.find((x) => x.id === id);
      if (ap) ap.status = "cancelado";
      return d;
    });

  const complete = (id) =>
    update((d) => {
      const ap = d.appointments.find((x) => x.id === id);
      if (ap) ap.status = "concluído";
      return d;
    });

  return (
    <div>
      <div style={styles.filterBar}>
        {['todos', 'hoje', 'futuros', 'pendentes'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {apps.length === 0 && <div style={styles.empty}>Nenhum agendamento encontrado.</div>}

      {apps.map((a) => {
        const svc = SERVICES.find((s) => s.id === a.service);
        const dateObj = new Date(`${a.date}T12:00:00`);
        return (
          <div key={a.id} style={{ ...styles.apCard, opacity: a.status === 'cancelado' ? 0.5 : 1 }}>
            <div style={styles.apLeft}>
              <div style={styles.apDate}>{dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
              <div style={styles.apTime}>{a.time}</div>
            </div>
            <div style={styles.apMid}>
              <div style={styles.apPhone}>{formatPhone(a.phone)}</div>
              <div style={styles.apService}>
                {svc?.label} {a.isFree && <span style={styles.freeBadge}>GRÁTIS</span>}
              </div>
            </div>
            <div style={styles.apRight}>
              <span style={{ ...styles.badge, background: statusColor(a.status) }}>{a.status}</span>
              {a.status === 'agendado' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn-sm-success" onClick={() => complete(a.id)}>✓</button>
                  <button className="btn-sm-danger" onClick={() => cancel(a.id)}>✕</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
