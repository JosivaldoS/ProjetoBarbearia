import { styles } from "../styles";
import { formatPhone } from "../utils/data";

export default function LoyaltyTab({ data, update }) {
  const cfg = data.loyaltyConfig;

  return (
    <div style={styles.formCard}>
      <h3 style={styles.cardTitle}>⭐ Programa de Fidelidade</h3>
      <div style={styles.toggleRow}>
        <span style={styles.rowLabel}>Ativar Fidelidade</span>
        <button
          className={`toggle ${cfg.enabled ? "on" : ""}`}
          onClick={() =>
            update((d) => {
              d.loyaltyConfig.enabled = !d.loyaltyConfig.enabled;
              return d;
            })
          }
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {cfg.enabled && (
        <>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Cortes para ganhar 1 grátis</span>
            <div style={styles.counter}>
              <button
                className="btn-sm"
                onClick={() =>
                  update((d) => {
                    if (d.loyaltyConfig.cutsRequired > 2) d.loyaltyConfig.cutsRequired -= 1;
                    return d;
                  })
                }
              >
                −
              </button>
              <span style={styles.counterVal}>{cfg.cutsRequired}</span>
              <button
                className="btn-sm"
                onClick={() =>
                  update((d) => {
                    d.loyaltyConfig.cutsRequired += 1;
                    return d;
                  })
                }
              >
                +
              </button>
            </div>
          </div>
          <p style={styles.cardSub}>
            A cada <strong>{cfg.cutsRequired}</strong> cortes realizados, o próximo será gratuito automaticamente.
          </p>
        </>
      )}

      <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>Visão Geral dos Clientes</h3>
      {Object.values(data.clients).map((c) => (
        <div key={c.phone} style={styles.loyaltyRow}>
          <span style={styles.apPhone}>{formatPhone(c.phone)}</span>
          <span style={styles.cardSub}>{c.cuts || 0} corte{(c.cuts || 0) !== 1 ? 's' : ''}</span>
          {c.freeNext && <span style={styles.freeBadge}>GRÁTIS</span>}
          {cfg.enabled && !c.freeNext && (
            <span style={styles.cardSub}>
              Faltam {cfg.cutsRequired - ((c.cuts || 0) % cfg.cutsRequired)}
            </span>
          )}
          <button
            className="btn-sm-success"
            title="Registrar corte manualmente"
            onClick={() =>
              update((d) => {
                if (!d.clients[c.phone]) return d;
                d.clients[c.phone].cuts = (d.clients[c.phone].cuts || 0) + 1;
                if (cfg.enabled && d.clients[c.phone].cuts % cfg.cutsRequired === 0) {
                  d.clients[c.phone].freeNext = true;
                }
                return d;
              })
            }
          >
            +corte
          </button>
        </div>
      ))}
      {Object.keys(data.clients).length === 0 && <div style={styles.empty}>Nenhum cliente cadastrado ainda.</div>}
    </div>
  );
}
