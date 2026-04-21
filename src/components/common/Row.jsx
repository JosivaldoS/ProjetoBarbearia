export default function Row({ label, value, highlight }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value" style={{ color: highlight ? "var(--gold)" : "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
