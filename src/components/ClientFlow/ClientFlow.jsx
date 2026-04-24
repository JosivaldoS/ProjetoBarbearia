import { useState } from "react";
import { SERVICES, next7Days, dateKey, formatPhone } from "../../utils/data";
import LoyaltyBadge from "../LoyaltyBadge";
import Row from "../common/Row";
import "./ClientFlow.css";

/**
 * Componente que gerencia o fluxo completo de agendamento para clientes
 * Guia o usuário através das etapas: telefone -> serviço -> data/horário -> confirmação
 * 
 * @param {Object} dados - Dados globais da aplicação
 * @param {Function} atualizarDados - Função para atualizar o estado global
 * @param {Function} setTelaAtual - Função para navegar entre telas
 */
export default function FluxoCliente({ dados, atualizarDados, setTelaAtual }) {
  // Etapa atual do fluxo: 'phone', 'date', 'confirm', 'done'
  const [etapaAtual, setEtapaAtual] = useState("phone");
  
  // Telefone formatado para exibição (XX) XXXXX-XXXX
  const [telefoneFormatado, setTelefoneFormatado] = useState("");
  
  // Indica se é um cliente novo (exibe mensagem de boas-vindas)
  const [clienteNovo, setClienteNovo] = useState(false);
  
  // Data selecionada para o agendamento
  const [dataSelecionada, setDataSelecionada] = useState(null);
  
  // Horário selecionado para o agendamento
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  
  // Serviço selecionado (corte, barba, etc.)
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  
  // Telefone bruto (apenas números) para uso como chave
  const [telefoneBruto, setTelefoneBruto] = useState("");

  // Dados do cliente atual recuperados do estado global
  const dadosCliente = dados.clients[telefoneBruto];
  
  // Configuração do programa de fidelidade
  const configuracaoFidelidade = dados.loyaltyConfig;


  /**
   * Processa o submissão do telefone
   * Valida o formato, cria cadastro se necessário e avança para próxima etapa
   */
  const processarTelefone = () => {
    // Verifica se o telefone tem pelo menos 10 dígitos
    if (telefoneBruto.length < 10) return;
    
    // Verifica se o cliente já existe na base
    const clienteExistente = !!dados.clients[telefoneBruto];
    
    if (!clienteExistente) {
      // Cria novo cadastro com dados iniciais
      atualizarDados((dadosAtuais) => {
        dadosAtuais.clients[telefoneBruto] = { 
          phone: telefoneBruto, 
          cuts: 0, 
          freeNext: false 
        };
        return dadosAtuais;
      });
      setClienteNovo(true);
    }
    
    // Avança para etapa de seleção de data/horário
    setEtapaAtual("date");
  };

  /**
   * Retorna os horários já agendados para uma data específica
   * @param {string} dataString - Data no formato YYYY-MM-DD
   * @returns {Array} Array com horários já ocupados
   */
  const horariosOcupados = (dataString) =>
    dados.appointments
      .filter((agendamento) => agendamento.date === dataString && agendamento.status !== "cancelado")
      .map((agendamento) => agendamento.time);

  /**
   * Calcula os horários disponíveis para uma data específica
   * Considera horários padrão, agendamentos existentes e horários passados (se for hoje)
   * @param {Date} data - Data a ser verificada
   * @returns {Array} Array com horários disponíveis
   */
  const horariosDisponiveis = (data) => {
    // Dia da semana (0=domingo, 1=segunda, ..., 6=sábado)
    const diaSemana = data.getDay();
    
    // Horários padrão para este dia da semana
    const horariosPadrao = dados.availableSlots[diaSemana] || [];
    
    // Remove horários já ocupados
    const ocupados = horariosOcupados(dateKey(data));
    let disponiveis = horariosPadrao.filter((horario) => !ocupados.includes(horario));

    // Se for hoje, remove horários que já passaram
    const hoje = new Date();
    const ehHoje = dateKey(data) === dateKey(hoje);
    
    if (ehHoje) {
      const horaAtual = hoje.getHours();
      const minutosAtuais = hoje.getMinutes();
      
      disponiveis = disponiveis.filter((horarioString) => {
        const [hora, minuto] = horarioString.split(':').map(Number);
        const tempoHorario = hora * 60 + minuto; // converte para minutos totais
        const tempoAtual = horaAtual * 60 + minutosAtuais;
        return tempoHorario > tempoAtual; // só mostra horários futuros
      });
    }

    return disponiveis;
  };

  /**
   * Confirma e salva o agendamento
   * Atualiza o programa de fidelidade se habilitado
   */
  const confirmarAgendamento = () => {
    // Verifica se o corte é gratuito pelo programa de fidelidade
    const ehGratuito = configuracaoFidelidade.enabled && dadosCliente && dadosCliente.freeNext;
    
    atualizarDados((dadosAtuais) => {
      // Cria o novo agendamento
      const novoAgendamento = {
        id: Date.now(), // ID único baseado no timestamp
        phone: telefoneBruto,
        date: dateKey(dataSelecionada),
        time: horarioSelecionado,
        service: servicoSelecionado,
        status: "agendado",
        isFree: ehGratuito,
      };
      dadosAtuais.appointments.push(novoAgendamento);

      // Atualiza o programa de fidelidade se habilitado
      if (configuracaoFidelidade.enabled) {
        // Garante que o cliente exista no array
        if (!dadosAtuais.clients[telefoneBruto]) {
          dadosAtuais.clients[telefoneBruto] = { cuts: 0, freeNext: false };
        }
        
        const cliente = dadosAtuais.clients[telefoneBruto];
        
        if (ehGratuito) {
          // Consome o corte gratuito
          cliente.freeNext = false;
        } else {
          // Incrementa contador de cortes
          cliente.cuts = (cliente.cuts || 0) + 1;
          
          // Verifica se atingiu a meta para próximo corte gratuito
          if (cliente.cuts % configuracaoFidelidade.cutsRequired === 0) {
            cliente.freeNext = true;
          }
        }
      }
      return dadosAtuais;
    });
    
    // Avança para tela de confirmação
    setEtapaAtual("done");
  };

  // Filtra apenas os dias que possuem horários disponíveis
  const diasDisponiveis = next7Days().filter((data) => horariosDisponiveis(data).length > 0);

  return (
    <div className="panel">
      <header className="panel-header">
        <button className="btn-back" onClick={() => setTelaAtual("home")}>← Voltar</button>
        <h2 className="panel-title">Agendamento</h2>
        <div className="steps">
          {['Telefone', 'Horário', 'Confirmação'].map((s, i) => (
            <div
              key={s}
              className="step-dot"
              style={{
                background:
                  i < (etapaAtual === 'phone' ? 0 : etapaAtual === 'date' ? 1 : etapaAtual === 'confirm' ? 2 : 3) + 1 ||
                  etapaAtual === 'done'
                    ? 'var(--gold)'
                    : 'var(--surface2)',
              }}
            />
          ))}
        </div>
      </header>

      <div className="panel-body">
        {etapaAtual === 'phone' && (
          <div className="fade-in form-card">
            <h3 className="card-title">Qual é o seu número?</h3>
            <p className="card-sub">Usamos apenas seu telefone para identificação</p>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              value={telefoneFormatado}
              onChange={(e) => {
                const formato = formatPhone(e.target.value);
                setTelefoneFormatado(formato);
                setTelefoneBruto(formato.replace(/\D/g, ""));
              }}
              onKeyDown={(e) => e.key === 'Enter' && processarTelefone()}
            />
            {configuracaoFidelidade.enabled && dados.clients[telefoneBruto] && (
              <LoyaltyBadge client={dados.clients[telefoneBruto]} config={configuracaoFidelidade} />
            )}
            <button
              className="btn-primary"
              style={{ marginTop: 24, width: '100%' }}
              onClick={processarTelefone}
              disabled={telefoneBruto.length < 10}
            >
              Continuar →
            </button>
          </div>
        )}

        {etapaAtual === 'date' && (
          <div className="fade-in">
            {clienteNovo && (
              <div className="welcome-bar">
                🎉 Bem-vindo! Cadastro realizado com sucesso.
              </div>
            )}
            {configuracaoFidelidade.enabled && dadosCliente?.freeNext && (
              <div className="free-bar">
                <div className="free-bar">Seu próximo corte é <strong>GRATUITO</strong>! Aproveite.</div>
              </div>
            )}

            <div className="section">
              <h3 className="section-title">Escolha o Serviço</h3>
              <div className="service-grid">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    className={`service-card ${servicoSelecionado === s.id ? 'active' : ''}`}
                    onClick={() => setServicoSelecionado(s.id)}
                  >
                    <span className="service-label">{s.label}</span>
                    <span className="service-price">
                      {dadosCliente?.freeNext && configuracaoFidelidade.enabled ? 'GRÁTIS' : s.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="section">
              <h3 className="section-title">Escolha o Dia</h3>
              <div className="day-grid">
                {diasDisponiveis.map((data) => (
                  <button
                    key={dateKey(data)}
                    className={`day-card ${dataSelecionada && dateKey(dataSelecionada) === dateKey(data) ? 'active' : ''}`}
                    onClick={() => {
                      setDataSelecionada(data);
                      setHorarioSelecionado(null);
                    }}
                  >
                    <span className="day-name">{data.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span className="day-num">{data.getDate()}</span>
                  </button>
                ))}
              </div>
            </div>

            {dataSelecionada && (
              <div className="section fade-in">
                <h3 className="section-title">Horários Disponíveis</h3>
                <div className="time-grid">
                  {horariosDisponiveis(dataSelecionada).map((horario) => (
                    <button
                      key={horario}
                      className={`time-slot ${horarioSelecionado === horario ? 'active' : ''}`}
                      onClick={() => setHorarioSelecionado(horario)}
                    >
                      {horario}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 24 }}
              disabled={!dataSelecionada || !horarioSelecionado || !servicoSelecionado}
              onClick={() => setEtapaAtual('confirm')}
            >
              Confirmar →
            </button>
          </div>
        )}

        {etapaAtual === 'confirm' && (
          <div className="fade-in form-card">
            <h3 className="card-title">Confirmar Agendamento</h3>
            <div className="confirm-card">
              <Row label="Telefone" value={telefoneFormatado} />
              <Row label="Serviço" value={SERVICES.find((s) => s.id === servicoSelecionado)?.label} />
              <Row
                label="Data"
                value={dataSelecionada?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              />
              <Row label="Horário" value={horarioSelecionado} />
              {configuracaoFidelidade.enabled && dadosCliente?.freeNext && (
                <Row label="Desconto" value="🎁 Corte Gratuito!" highlight />
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setEtapaAtual('date')}>
                ← Voltar
              </button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={confirmarAgendamento}>
                Agendar ✓
              </button>
            </div>
          </div>
        )}

        {etapaAtual === 'done' && (
          <div className="fade-in form-card" style={{ textAlign: 'center' }}>
            <div className="success-icon">✓</div>
            <h3 className="card-title">Agendado!</h3>
            <p className="card-sub">
              Seu horário está confirmado para{' '}
              <strong>
                {dataSelecionada?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </strong>{' '}
              às <strong>{horarioSelecionado}</strong>.
            </p>
            {configuracaoFidelidade.enabled && <LoyaltyBadge client={dados.clients[telefoneBruto]} config={configuracaoFidelidade} />}
            <button
              className="btn-primary"
              style={{ marginTop: 24, width: '100%' }}
              onClick={() => setTelaAtual('home')}
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
