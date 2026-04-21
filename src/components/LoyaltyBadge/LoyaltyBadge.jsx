import "./LoyaltyBadge.css";

export default function LoyaltyBadge({ client, config }) {
  if (!config.enabled || !client) return null;

  const cuts = client.cuts || 0;
  const req = config.cutsRequired;
  const progress = cuts % req;
  const pct = (progress / req) * 100;

  return (
    <div className="loyalty-badge">
      <div className="loyalty-top">
        <span className="loyalty-title">✂ Fidelidade</span>
        {client.freeNext ? (
          <span className="loyalty-free">GRÁTIS DISPONÍVEL!</span>
        ) : (
          <span className="loyalty-count">{progress}/{req} cortes</span>
        )}
      </div>

      <div className="loyalty-bar">
        <div
          className="loyalty-fill"
          style={{
            width: `${client.freeNext ? 100 : pct}%`,
          }}
        />
      </div>

      {!client.freeNext && (
        <p className="loyalty-sub">
          Faltam <strong>{req - progress}</strong> corte{req - progress !== 1 ? "s" : ""} para o próximo gratuito!
        </p>
      )}
    </div>
  );
}
