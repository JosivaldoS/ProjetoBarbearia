import { useState } from "react";
import AgendaTab from "./AgendaTab";
import SlotsTab from "./SlotsTab";
import LoyaltyTab from "./LoyaltyTab";
import ClientsTab from "./ClientsTab";
import { styles } from "../styles";

export default function BarberPanel({ data, update, setView, auth, setAuth }) {
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState("agenda");
  const [pwError, setPwError] = useState(false);

  if (!auth) {
    return (
      <div style={styles.panel}>
        <header style={styles.panelHeader}>
          <button className="btn-back" onClick={() => setView("home")}>
            ← Voltar
          </button>
          <h2 style={styles.panelTitle}>Área do Barbeiro</h2>
          <div />
        </header>
        <div style={styles.panelBody}>
          <div className="fade-in" style={styles.formCard}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 48 }}>🔐</span>
              <h3 style={styles.cardTitle}>Acesso Restrito</h3>
              <p style={styles.cardSub}>Digite a senha do barbeiro</p>
            </div>
            <input
              type="password"
              style={styles.input}
              placeholder="Senha"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setPwError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (pw === data.barberPassword) setAuth(true);
                  else setPwError(true);
                }
              }}
            />
            {pwError && <p style={styles.error}>Senha incorreta. (padrão: 1234)</p>}
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => {
                if (pw === data.barberPassword) setAuth(true);
                else setPwError(true);
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "agenda", label: "📅 Agenda" },
    { id: "slots", label: "⏰ Horários" },
    { id: "loyalty", label: "⭐ Fidelidade" },
    { id: "clients", label: "👥 Clientes" },
  ];

  return (
    <div style={styles.panel}>
      <header style={styles.panelHeader}>
        <button
          className="btn-back"
          onClick={() => {
            setAuth(false);
            setView("home");
          }}
        >
          ← Sair
        </button>
        <h2 style={styles.panelTitle}>Painel do Barbeiro</h2>
        <div />
      </header>

      <div style={styles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={styles.panelBody}>
        {tab === "agenda" && <AgendaTab data={data} update={update} />}
        {tab === "slots" && <SlotsTab data={data} update={update} />}
        {tab === "loyalty" && <LoyaltyTab data={data} update={update} />}
        {tab === "clients" && <ClientsTab data={data} update={update} />}
      </div>
    </div>
  );
}
