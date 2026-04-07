import { styles } from "../styles";

export default function LoyaltyBadge({ client, config }) {
  if (!config.enabled || !client) return null;

  const cuts = client.cuts || 0;
  const req = config.cutsRequired;
  const progress = cuts % req;
  const pct = (progress / req) * 100;

  return (
    <div style={styles.loyaltyBadge}>
      <div style={styles.loyaltyTop}>
        <span style={styles.loyaltyTitle}>✂ Fidelidade</span>
        {client.freeNext ? (
          <span style={styles.loyaltyFree}>GRÁTIS DISPONÍVEL!</span>
        ) : (
          <span style={styles.loyaltyCount}>{progress}/{req} cortes</span>
        )}
      </div>

      <div style={styles.loyaltyBar}>
        <div
          style={{
            ...styles.loyaltyFill,
            width: `${client.freeNext ? 100 : pct}%`,
          }}
        />
      </div>

      {!client.freeNext && (
        <p style={styles.loyaltySub}>
          Faltam <strong>{req - progress}</strong> corte{req - progress !== 1 ? "s" : ""} para o próximo gratuito!
        </p>
      )}
    </div>
  );
}
