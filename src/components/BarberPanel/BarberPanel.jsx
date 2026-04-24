import { useState } from "react";
import AgendaTab from "../AgendaTab/AgendaTab";
import SlotsTab from "../SlotsTab/SlotsTab";
import LoyaltyTab from "../LoyaltyTab/LoyaltyTab";
import ClientsTab from "../ClientsTab/ClientsTab";
import "./BarberPanel.css";

/**
 * Componente do painel administrativo do barbeiro
 * Controla autenticação e gerencia as abas de funcionalidades
 * 
 * @param {Object} dados - Dados globais da aplicação
 * @param {Function} atualizarDados - Função para atualizar o estado global
 * @param {Function} setTelaAtual - Função para navegar entre telas
 * @param {boolean} autenticado - Indica se o barbeiro está autenticado
 * @param {Function} setAutenticado - Função para alterar estado de autenticação
 */
export default function PainelBarbeiro({ dados, atualizarDados, setTelaAtual, autenticado, setAutenticado }) {
  // Senha digitada pelo usuário no campo de autenticação
  const [senhaDigitada, setSenhaDigitada] = useState("");
  
  // Aba atual do painel: 'agenda', 'slots', 'loyalty', 'clients'
  const [abaAtual, setAbaAtual] = useState("agenda");
  
  // Indica se houve erro na autenticação (senha incorreta)
  const [erroSenha, setErroSenha] = useState(false);

  // Se não estiver autenticado, mostra tela de login
  if (!autenticado) {
    return (
      <div className="panel">
        <header className="panel-header">
          <button className="btn-back" onClick={() => setTelaAtual("home")}>
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
              value={senhaDigitada}
              onChange={(e) => {
                setSenhaDigitada(e.target.value);
                setErroSenha(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Verifica se a senha digitada corresponde à senha cadastrada
                  if (senhaDigitada === dados.barberPassword) {
                    setAutenticado(true);
                  } else {
                    setErroSenha(true);
                  }
                }
              }}
            />
            {erroSenha && <p className="error">Senha incorreta. (padrão: 1234)</p>}
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => {
                // Verifica se a senha digitada corresponde à senha cadastrada
                if (senhaDigitada === dados.barberPassword) {
                  setAutenticado(true);
                } else {
                  setErroSenha(true);
                }
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Configuração das abas disponíveis no painel do barbeiro
   * Cada aba representa uma funcionalidade administrativa
   */
  const abasDisponiveis = [
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
            // Faz logout do barbeiro e retorna à tela inicial
            setAutenticado(false);
            setTelaAtual("home");
          }}
        >
          ← Sair
        </button>
        <h2 className="panel-title">Painel do Barbeiro</h2>
        <div />
      </header>

      <div className="tab-bar">
        {abasDisponiveis.map((aba) => (
          <button
            key={aba.id}
            className={`tab-btn ${abaAtual === aba.id ? "active" : ""}`}
            onClick={() => setAbaAtual(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <div className="panel-body">
        {/* Renderização condicional das abas com base na aba selecionada */}
        {abaAtual === "agenda" && <AgendaTab dados={dados} atualizarDados={atualizarDados} />}
        {abaAtual === "slots" && <SlotsTab dados={dados} atualizarDados={atualizarDados} />}
        {abaAtual === "loyalty" && <LoyaltyTab dados={dados} atualizarDados={atualizarDados} />}
        {abaAtual === "clients" && <ClientsTab dados={dados} atualizarDados={atualizarDados} />}
      </div>
    </div>
  );
}
