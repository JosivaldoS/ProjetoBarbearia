import { formatPhone } from "../../utils/data";
import "./LoyaltyTab.css";

export default function LoyaltyTab({ dados, atualizarDados }) {
  // Essa função funciona assim: o cliente ganha um corte grátis a cada X cortes realizados. O número X é configurável aqui. O sistema conta quantos cortes cada cliente tem e, quando atinge o número X, marca o próximo corte como grátis. O cliente pode usar esse corte grátis na próxima visita, e então o contador de cortes volta a zero para ele.

  const cfg = dados.loyaltyConfig;

  return (
    <div className="form-card">
      <h3 className="card-title">⭐ Programa de Fidelidade</h3>
      <div className="toggle-row">
        <span className="row-label">Ativar Fidelidade</span>
        <button
          className={`toggle ${cfg.enabled ? "on" : ""}`}
          onClick={() =>
            atualizarDados((d) => {
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
          <div className="row">
            <span className="row-label">Cortes para ganhar 1 grátis</span>
            <div className="counter">
              <button
                className="btn-sm"
                onClick={() =>
                  atualizarDados((d) => {
                    if (d.loyaltyConfig.cutsRequired > 2) d.loyaltyConfig.cutsRequired -= 1;
                    return d;
                  })
                }
              >
                −
              </button>
              <span className="counter-val">{cfg.cutsRequired}</span>
              <button
                className="btn-sm"
                onClick={() =>
                  atualizarDados((d) => {
                    d.loyaltyConfig.cutsRequired += 1;
                    return d;
                  })
                }
              >
                +
              </button>
            </div>
          </div>
          <p className="card-sub">
            A cada <strong>{cfg.cutsRequired}</strong> cortes realizados, o próximo será gratuito automaticamente.
          </p>
        </>
      )}

      <h3 className="section-title" style={{ marginTop: 32 }}>Visão Geral dos Clientes</h3>
      {Object.values(dados.clients).map((c) => (
        <div key={c.phone} className="loyalty-row">
          <span className="ap-phone">{formatPhone(c.phone)}</span>
          <span className="card-sub">{c.cuts || 0} corte{(c.cuts || 0) !== 1 ? 's' : ''}</span>
          {c.freeNext && <span className="free-badge">GRÁTIS</span>}
          {cfg.enabled && !c.freeNext && (
            <span className="card-sub">
              Faltam {cfg.cutsRequired - ((c.cuts || 0) % cfg.cutsRequired)}
            </span>
          )}
          <button
            className="btn-sm-success"
            title="Registrar corte manualmente"
            onClick={() =>
              atualizarDados((d) => {
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
      {Object.keys(dados.clients).length === 0 && <div className="empty">Nenhum cliente cadastrado ainda.</div>}
    </div>
  );
}
