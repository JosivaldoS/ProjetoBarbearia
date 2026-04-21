import "./HomeScreen.css";

export default function HomeScreen({ setView }) {
  return (
    <div className="home">
      <div className="home-bg" />
      <div className="home-content">
        <div className="logo-wrap">
          <span className="logo-scissors">✂</span>
          <h1 className="logo-text">
            NAVALHA<span className="logo-accent">&</span>CO.
          </h1>
          <p className="logo-sub">Barbearia Tradicional</p>
        </div>
        <div className="home-buttons">
          <button className="btn-primary" onClick={() => setView("client")}> 
            <span>Agendar Horário</span>
            <span className="btn-arrow">→</span>
          </button>
          <button className="btn-ghost" onClick={() => setView("barber")}>Painel do Barbeiro</button>
        </div>
      </div>
      <div className="home-decor">
        <div className="decor-line" />
        <span className="decor-text">EST. 2024</span>
        <div className="decor-line" />
      </div>
    </div>
  );
}
