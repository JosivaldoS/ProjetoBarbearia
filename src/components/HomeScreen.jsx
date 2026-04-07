import { styles } from "../styles";

export default function HomeScreen({ setView }) {
  return (
    <div style={styles.home}>
      <div style={styles.homeBg} />
      <div style={styles.homeContent}>
        <div style={styles.logoWrap}>
          <span style={styles.logoScissors}>✂</span>
          <h1 style={styles.logoText}>
            NAVALHA<span style={styles.logoAccent}>&</span>CO.
          </h1>
          <p style={styles.logoSub}>Barbearia Tradicional</p>
        </div>
        <div style={styles.homeButtons}>
          <button className="btn-primary" onClick={() => setView("client")}> 
            <span>Agendar Horário</span>
            <span style={styles.btnArrow}>→</span>
          </button>
          <button className="btn-ghost" onClick={() => setView("barber")}>Painel do Barbeiro</button>
        </div>
      </div>
      <div style={styles.homeDecor}>
        <div style={styles.decorLine} />
        <span style={styles.decorText}>EST. 2024</span>
        <div style={styles.decorLine} />
      </div>
    </div>
  );
}
