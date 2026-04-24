import { useState } from "react";
import AgendaTab from "../AgendaTab/AgendaTab";
import SlotsTab from "../SlotsTab/SlotsTab";
import LoyaltyTab from "../LoyaltyTab/LoyaltyTab";
import ClientsTab from "../ClientsTab/ClientsTab";
import "./BarberPanel.css";

/**
 * PainelBarbeiro — área administrativa protegida por senha.
 * Login: selecionar barbeiro + senha individual (ou senha global legada).
 */
export default function PainelBarbeiro({ dados, atualizarDados, setTelaAtual, barbeiroAutenticado, setBarbeiroAutenticado }) {
  const [aba, setAba] = useState("agenda");
  const [barbeiroLogin, setBarbeiroLogin] = useState(null);
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState(false);

  /** Autentica barbeiro comparando senha individual ou global */
  const handleLogin = () => {
    if (!barbeiroLogin) return;
    const correto = senha === barbeiroLogin.senha || senha === dados.barberPassword;
    if (correto) setBarbeiroAutenticado(barbeiroLogin);
    else setErroSenha(true);
  };

  // ── Tela de login ──────────────────────────────────────────
  if (!barbeiroAutenticado) {
    return (
      <div className="panel">
        <header className="panel-header">
          <button className="btn-back" onClick={() => setTelaAtual("home")}>← Voltar</button>
          <h2 className="panel-title">Área do Barbeiro</h2>
          <div />
        </header>
        <div className="panel-body">
          <div className="fade-in form-card">
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <span style={{ fontSize:48 }}>🔐</span>
              <h3 className="card-title">Acesso Restrito</h3>
              <p className="card-sub">Selecione seu perfil e digite a senha</p>
            </div>
            <div className="barber-grid">
              {dados.barbeiros?.map(b => (
                <button key={b.id} className={`barber-card ${barbeiroLogin?.id===b.id?"active":""}`}
                  onClick={() => { setBarbeiroLogin(b); setErroSenha(false); setSenha(""); }}>
                  <span className="barber-avatar-large">{b.nome.charAt(0)}</span>
                  <span className="barber-name">{b.nome}</span>
                </button>
              ))}
            </div>
            {barbeiroLogin && (
              <>
                <input type="password" className="input" style={{ marginTop:16 }} placeholder={`Senha de ${barbeiroLogin.nome}`}
                  value={senha} onChange={e => { setSenha(e.target.value); setErroSenha(false); }}
                  onKeyDown={e => e.key==="Enter" && handleLogin()} />
                {erroSenha && <p className="error">Senha incorreta.</p>}
                <button className="btn-primary" style={{ width:"100%", marginTop:16 }} onClick={handleLogin}>Entrar</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Painel autenticado ──────────────────────────────────────
  // eAdmin determina quais abas e permissões o usuário logado possui
  const eAdmin = !!barbeiroAutenticado.eAdmin;

  const abas = [
    { id:"agenda", label:"📅 Agenda" },
    { id:"horarios", label:"⏰ Horários" },
    { id:"fidelidade", label:"⭐ Fidelidade" },
    { id:"clientes", label:"👥 Clientes" },
    { id:"servicos", label:"💈 Serviços" },
    // Aba de gerenciamento da equipe: EXCLUSIVA do administrador
    ...(eAdmin ? [{ id:"barbeiros", label:"✂️ Equipe" }] : []),
    { id:"qrcode", label:"🔳 QR Code" },
  ];

  return (
    <div className="panel">
      <header className="panel-header">
        <button className="btn-back" onClick={() => { setBarbeiroAutenticado(null); setTelaAtual("home"); }}>← Sair</button>
        <h2 className="panel-title">
          Olá, {barbeiroAutenticado.nome} {eAdmin ? "👑" : "✂"}
        </h2>
        <div />
      </header>
      <div className="tab-bar">
        {abas.map(a => (
          <button key={a.id} className={`tab-btn ${aba===a.id?"active":""}`} onClick={() => setAba(a.id)}>{a.label}</button>
        ))}
      </div>
      <div className="panel-body">
        {/* Admin vê todos os agendamentos; barbeiro comum vê apenas os seus */}
        {aba === "agenda"     && <AgendaTab dados={dados} atualizarDados={atualizarDados} barbeiro={barbeiroAutenticado} eAdmin={eAdmin} />}
        {aba === "horarios"   && <SlotsTab dados={dados} atualizarDados={atualizarDados} barbeiro={barbeiroAutenticado} />}
        {aba === "fidelidade" && <LoyaltyTab dados={dados} atualizarDados={atualizarDados} />}
        {aba === "clientes"   && <ClientsTab dados={dados} atualizarDados={atualizarDados} />}
        {aba === "servicos"   && <div className="form-card"><h3 className="card-title">💈 Serviços</h3><p className="card-sub">TODO: Implementar AbaServicos</p></div>}
        {/* Aba Barbeiros: renderizada somente se eAdmin (dupla proteção além da ocultação da aba) */}
        {aba === "barbeiros" && eAdmin && <div className="form-card"><h3 className="card-title">✂️ Equipe</h3><p className="card-sub">TODO: Implementar AbaBarbeiros</p></div>}
        {aba === "qrcode"     && <div className="form-card"><h3 className="card-title">🔳 QR Code</h3><p className="card-sub">TODO: Implementar AbaQRCode</p></div>}
      </div>
    </div>
  );
}
