import { styles } from "../../styles";

export default function Row({ label, value, highlight }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{ ...styles.rowValue, color: highlight ? "var(--gold)" : "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
