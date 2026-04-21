import { useState } from "react";
import AgendaTab from "../AgendaTab/AgendaTab";
import SlotsTab from "../SlotsTab/SlotsTab";
import LoyaltyTab from "../LoyaltyTab/LoyaltyTab";
import ClientsTab from "../ClientsTab/ClientsTab";
import "./BarberPanel.css";

export default function BarberPanel({ data, update, setView, auth, setAuth }) {
  // Essa função funciona assim: quando o barbeiro tenta acessar o painel, ele precisa digitar a senha. Se a senha estiver correta, ele ganha acesso ao painel. Se não, ele vê uma mensagem de erro. O estado "auth" controla se o barbeiro está autenticado ou não. O estado "pw" armazena a senha digitada, e "pwError" indica se houve um erro na autenticação.

  const [pw, setPw] = useState("");
  const [tab, setTab] = useState("agenda");
  const [pwError, setPwError] = useState(false);

  if (!auth) {
    return (
      <div className="panel">
        <header className="panel-header">
          <button className="btn-back" onClick={() => setView("home")}>
            ← Voltar
          </button>
          <h2 className="panel-title">Área do Barbeiro</h2>
          <div />
        </header>
        <div className="panel-body">
          <div className="fade-in form-card">
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 48 }}>🔐</span>
              <h3 className="card-title">Acesso Restrito</h3>
              <p className="card-sub">Digite a senha do barbeiro</p>
            </div>
            <input
              type="password"
              className="input"
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
            {pwError && <p className="error">Senha incorreta. (padrão: 1234)</p>}
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
    <div className="panel">
      <header className="panel-header">
        <button
          className="btn-back"
          onClick={() => {
            setAuth(false);
            setView("home");
          }}
        >
          ← Sair
        </button>
        <h2 className="panel-title">Painel do Barbeiro</h2>
        <div />
      </header>

      <div className="tab-bar">
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

      <div className="panel-body">
        {tab === "agenda" && <AgendaTab data={data} update={update} />}
        {tab === "slots" && <SlotsTab data={data} update={update} />}
        {tab === "loyalty" && <LoyaltyTab data={data} update={update} />}
        {tab === "clients" && <ClientsTab data={data} update={update} />}
      </div>
    </div>
  );
}
