export default function Row({ label, value, highlight }) {
  // Essa função funciona assim: ela recebe três props: label, value e highlight. O label é o texto que vai aparecer à esquerda, o value é o texto que vai aparecer à direita, e o highlight é um booleano que indica se o valor deve ser destacado ou não.
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value" style={{ color: highlight ? "var(--gold)" : "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
