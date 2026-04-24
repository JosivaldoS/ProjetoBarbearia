import { useState, useCallback, useMemo } from "react";
import { 
  next7Days, dateKey, formatPhone, formatarPreco, gerarCodigoPix, 
  validarTelefone, verificarAgendamentoDuplicado, contarCortesReais, calcularProximoGratis 
} from "../../utils/data";
import LoyaltyBadge from "../LoyaltyBadge";
import Row from "../common/Row";
import "./ClientFlow.css";

/**
 * Componente que gerencia o fluxo completo de agendamento para clientes
 * Suporta Flow A (padrão) e Flow B (barbeiro pré-selecionado)
 * Inclui validações, pagamento PIX e fidelidade melhorada
 * 
 * @param {Object} dados - Dados globais da aplicação
 * @param {Function} atualizarDados - Função para atualizar o estado global
 * @param {Function} setTelaAtual - Função para navegar entre telas
 * @param {Object} barbeiroPreSelecionado - Barbeiro pré-selecionado para Flow B (opcional)
 */
export default function FluxoCliente({ dados, atualizarDados, setTelaAtual, barbeiroPreSelecionado }) {
  // Etapa atual do fluxo: 'telefone', 'nome', 'barbeiro', 'servico', 'pagamento', 'confirmacao', 'concluido'
  const [etapaAtual, setEtapaAtual] = useState("telefone");
  
  // Telefone formatado para exibição (XX) XXXXX-XXXX
  const [telefoneFormatado, setTelefoneFormatado] = useState("");
  
  // Telefone bruto (apenas números) para uso como chave
  const [telefoneBruto, setTelefoneBruto] = useState("");
  
  // Nome digitado para cadastro de cliente novo
  const [nomeDigitado, setNomeDigitado] = useState("");
  
  // Mensagem de erro para validação de nome
  const [erroNome, setErroNome] = useState("");
  
  // Indica se é um cliente novo (exibe mensagem de boas-vindas)
  const [clienteNovo, setClienteNovo] = useState(false);
  
  // Barbeiro selecionado para o agendamento
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(barbeiroPreSelecionado);
  
  // Serviço selecionado (corte, barba, etc.)
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  
  // Data selecionada para o agendamento
  const [dataSelecionada, setDataSelecionada] = useState(null);
  
  // Horário selecionado para o agendamento
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  
  // Método de pagamento selecionado
  const [metodoPagamento, setMetodoPagamento] = useState(null);
  
  // Código PIX gerado para pagamento
  const [codigoPix, setCodigoPix] = useState(null);
  
  // Mensagem de erro exibida na tela de confirmação (ex: slot duplicado)
  const [erroAgendamento, setErroAgendamento] = useState("");

  // Dados do cliente atual recuperados do estado global
  const dadosCliente = dados.clientes[telefoneBruto];
  
  // Configuração do programa de fidelidade
  const configuracaoFidelidade = dados.fidelidadeConfig;
  
  // Serviço selecionado (objeto completo)
  const servico = dados.servicos?.find(s => s.id === servicoSelecionado);


  /**
   * Calcula horários livres para um barbeiro em uma data.
   * Remove slots já ocupados por agendamentos confirmados do mesmo barbeiro.
   */
  const horariosDisponiveis = useCallback((data, barbeiro) => {
    if (!data || !barbeiro) return [];
    const diaSemana = data.getDay();
    const dataStr = dateKey(data);
    const slots = dados.horariosPorBarbeiro?.[barbeiro.id]?.[diaSemana]
      || dados.horariosGlobais?.[diaSemana] || [];
    const ocupados = dados.agendamentos
      .filter(a => a.data === dataStr && a.barbeiroId === barbeiro.id && a.status !== "cancelado")
      .map(a => a.horario);
    return slots.filter(h => !ocupados.includes(h));
  }, [dados]);

  /** Dias com pelo menos um horário disponível nos próximos 14 dias */
  const diasComVaga = useMemo(() =>
    next7Days().filter(d => horariosDisponiveis(d, barbeiroSelecionado).length > 0),
    [barbeiroSelecionado, horariosDisponiveis]
  );

  /**
   * Etapa 1 — valida telefone usando a função validarTelefone().
   * Rejeita números com menos de 10 dígitos, sequências inválidas (00000...).
   * Decide se é cliente novo (→ etapa nome) ou existente (→ barbeiro/serviço).
   */
  const processarTelefone = () => {
    if (!validarTelefone(telefoneBruto)) return;
    if (!dados.clientes[telefoneBruto]) {
      setClienteNovo(true);
      setEtapaAtual("nome");
    } else {
      setEtapaAtual(barbeiroPreSelecionado ? "servico" : "barbeiro");
    }
  };

  /**
   * Etapa 2 — valida e salva o nome do cliente novo.
   * Regras: não vazio, mínimo 2 caracteres, apenas letras e espaços.
   */
  const processarNome = () => {
    const nomeLimpo = nomeDigitado.trim();

    // Validação: nome muito curto
    if (nomeLimpo.length < 2) {
      setErroNome("Digite um nome com pelo menos 2 caracteres.");
      return;
    }
    // Validação: apenas letras, espaços e acentos (sem números ou símbolos)
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nomeLimpo)) {
      setErroNome("O nome deve conter apenas letras.");
      return;
    }

    setErroNome("");
    atualizarDados(d => {
      // TODO: Supabase — inserir novo cliente
      d.clientes[telefoneBruto] = {
        telefone: telefoneBruto,
        nome: nomeLimpo,
        cortes: 0,
        proximoGratis: false,
      };
      return d;
    });
    setEtapaAtual(barbeiroPreSelecionado ? "servico" : "barbeiro");
  };


  /**
   * Etapa final — cria o agendamento com todos os dados coletados.
   * Valida duplicata e elegibilidade de corte gratuito antes de salvar.
   * IMPORTANTE: a fidelidade NÃO é atualizada aqui — apenas na conclusão
   * pelo barbeiro (função concluir em AbaAgenda). Isso impede que clientes
   * acumulem cortes futuros não realizados.
   */
  const confirmarAgendamento = () => {
    // ── Validação: agendamento duplicado ──────────────────────
    const dataStr = dateKey(dataSelecionada);
    if (verificarAgendamentoDuplicado(dados.agendamentos, barbeiroSelecionado?.id, dataStr, horarioSelecionado)) {
      setErroAgendamento("Este horário acabou de ser reservado. Por favor, escolha outro.");
      setEtapaAtual("servico");
      return;
    }

    // ── Validação: elegibilidade do corte gratuito ────────────
    // Recalcula a partir dos cortes REAIS concluídos — não do contador em memória.
    // Isso garante que um cliente não possa usar o benefício de gratuidade
    // baseado em agendamentos futuros que ainda não foram realizados.
    const cortesReaisAtuais = contarCortesReais(dados.agendamentos, telefoneBruto);
    const realmenteProximoGratis =
      configuracaoFidelidade.ativo &&
      cortesReaisAtuais > 0 &&
      cortesReaisAtuais % configuracaoFidelidade.cortesNecessarios === 0;

    // Se o cliente acredita que tem gratuidade mas os cortes reais não confirmam, bloqueia
    const eGratis = realmenteProximoGratis && (dadosCliente?.proximoGratis === true);

    const precoFinal = eGratis ? 0 : (servico?.preco || 0);
    const pixGerado = metodoPagamento === "pix"
      ? gerarCodigoPix(precoFinal, dadosCliente?.nome || "Cliente")
      : null;

    atualizarDados(d => {
      // TODO: Supabase — inserir agendamento com campos corretos
      d.agendamentos.push({
        id: Date.now(),
        telefone: telefoneBruto,
        barbeiroId: barbeiroSelecionado?.id || null,
        data: dataStr,
        horario: horarioSelecionado,
        servicoId: servicoSelecionado,
        status: metodoPagamento === "pix" ? "pago" : "agendado",
        concluido: false,
        eGratis,
        pagamento: metodoPagamento,
        codigoPix: pixGerado,
      });

      // ── FIDELIDADE: NÃO atualizar aqui! ──────────────────────
      // O contador de fidelidade é calculado dinamicamente a partir
      // dos agendamentos com concluido===true. A atualização de
      // cliente.cortes e cliente.proximoGratis acontece APENAS quando
      // o barbeiro marca o agendamento como concluído em AbaAgenda.
      // Isso elimina a possibilidade de acúmulo antecipado indevido.

      return d;
    });

    setCodigoPix(pixGerado);
    setErroAgendamento("");
    setEtapaAtual("concluido");
  };

  // Índice de progresso para os pontinhos no cabeçalho
  const ordemEtapas = ["telefone","nome","barbeiro","servico","pagamento","confirmacao","concluido"];
  const indiceAtual = ordemEtapas.indexOf(etapaAtual);

  return (
    <div className="panel">
      <header className="panel-header">
        <button className="btn-back" onClick={() => setTelaAtual("home")}>← Voltar</button>
        <h2 className="panel-title">Agendamento</h2>
        <div className="steps">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="step-dot" style={{ background: i <= indiceAtual ? "var(--gold)" : "var(--surface2)" }} />
          ))}
        </div>
      </header>

      <div className="panel-body">
        {/* ── TELEFONE ─────────────────────────── */}
        {etapaAtual === "telefone" && (
          <div className="fade-in form-card">
            <h3 className="card-title">Qual é o seu número?</h3>
            <p className="card-sub">Usamos apenas seu telefone para identificação</p>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              value={telefoneFormatado}
              onChange={e => { const f = formatPhone(e.target.value); setTelefoneFormatado(f); setTelefoneBruto(f.replace(/\D/g,"")); }}
              onKeyDown={e => e.key === "Enter" && processarTelefone()}
            />
            {/* Mensagem auxiliar: guia o usuário sobre o formato esperado */}
            {telefoneBruto.length > 0 && !validarTelefone(telefoneBruto) && (
              <p style={{ ...{color:"#f87171", marginTop:6}, fontSize:14 }}>
                Digite um número de telefone válido (DDD + número).
              </p>
            )}
            {configuracaoFidelidade.ativo && dados.clientes[telefoneBruto] && (
              <LoyaltyBadge client={dados.clientes[telefoneBruto]} config={configuracaoFidelidade} agendamentos={dados.agendamentos} />
            )}
            <button
              className="btn-primary"
              style={{ marginTop: 24, width: "100%" }}
              onClick={processarTelefone}
              disabled={!validarTelefone(telefoneBruto)}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── NOME (cliente novo) ──────────────── */}
        {etapaAtual === "nome" && (
          <div className="fade-in form-card">
            <div style={{ textAlign:"center", marginBottom:20 }}><span style={{fontSize:40}}>👋</span></div>
            <h3 className="card-title">Bem-vindo!</h3>
            <p className="card-sub">Número não encontrado. Para completar o cadastro, informe seu nome:</p>
            <input
              className="input"
              style={{ borderColor: erroNome ? "#f87171" : undefined }}
              placeholder="Seu nome completo"
              value={nomeDigitado}
              onChange={e => { setNomeDigitado(e.target.value); setErroNome(""); }}
              onKeyDown={e => e.key === "Enter" && processarNome()}
            />
            {/* Exibe erro de validação do nome, se houver */}
            {erroNome && <p style={{ ...{color:"#f87171", marginTop:6}, fontSize:14 }}>{erroNome}</p>}
            <button className="btn-primary" style={{ marginTop: 20, width: "100%" }} onClick={processarNome} disabled={!nomeDigitado.trim()}>
              Cadastrar e Continuar →
            </button>
          </div>
        )}

        {/* ── BARBEIRO (Flow A) ────────────────── */}
        {etapaAtual === "barbeiro" && (
          <div className="fade-in">
            {clienteNovo && <div className="welcome-bar">🎉 Cadastro realizado! Agora escolha seu barbeiro.</div>}
            {configuracaoFidelidade.ativo && calcularProximoGratis(dados.agendamentos, telefoneBruto, configuracaoFidelidade.cortesNecessarios) && dadosCliente?.proximoGratis && (
              <div className="free-bar">🎁 Seu próximo corte é <strong>GRATUITO</strong>!</div>
            )}
            <div className="section">
              <h3 className="section-title">Escolha o Barbeiro</h3>
              {/* Admin é filtrado — não deve aparecer como opção de atendimento */}
              <div className="barber-grid">
                {dados.barbeiros?.filter(b => !b.eAdmin).map(b => (
                  <button key={b.id} className={`barber-card ${barbeiroSelecionado?.id===b.id?"active":""}`} onClick={() => setBarbeiroSelecionado(b)}>
                    <span className="barber-avatar-large">{b.nome.charAt(0)}</span>
                    <span className="barber-name">{b.nome}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary" style={{ width:"100%" }} disabled={!barbeiroSelecionado} onClick={() => setEtapaAtual("servico")}>
              Continuar →
            </button>
          </div>
        )}

        {/* ── SERVIÇO + DATA + HORÁRIO ─────────── */}
        {etapaAtual === "servico" && (
          <div className="fade-in">
            {clienteNovo && !barbeiroPreSelecionado && <div className="welcome-bar">🎉 Cadastro realizado com sucesso!</div>}
            {configuracaoFidelidade.ativo && calcularProximoGratis(dados.agendamentos, telefoneBruto, configuracaoFidelidade.cortesNecessarios) && dadosCliente?.proximoGratis && (
              <div className="free-bar">🎁 Seu próximo corte é <strong>GRATUITO</strong>!</div>
            )}
            {/* Alerta de horário duplicado — exibido quando confirmarAgendamento detecta conflito */}
            {erroAgendamento && (
              <div style={{ background:"#2d0a0a", border:"1px solid #dc2626", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#fca5a5", fontSize:14 }}>
                ⚠️ {erroAgendamento}
              </div>
            )}

            {/* Confirmação do barbeiro escolhido */}
            {barbeiroSelecionado && (
              <div className="barber-confirmed">
                <span className="barber-avatar-small">{barbeiroSelecionado.nome.charAt(0)}</span>
                <span>Barbeiro: <strong>{barbeiroSelecionado.nome}</strong></span>
                {!barbeiroPreSelecionado && (
                  <button className="btn-back" style={{ marginLeft:"auto" }} onClick={() => setEtapaAtual("barbeiro")}>Trocar</button>
                )}
              </div>
            )}

            {/* Serviços dinâmicos */}
            <div className="section">
              <h3 className="section-title">Escolha o Serviço</h3>
              <div className="service-grid">
                {(() => {
                  // Recalcula gratuidade com base em cortes REAIS concluídos
                  // (não o contador em memória que pode incluir agendamentos futuros)
                  const cortesReais = contarCortesReais(dados.agendamentos, telefoneBruto);
                  const temGratuidadeReal =
                    configuracaoFidelidade.ativo &&
                    cortesReais > 0 &&
                    cortesReais % configuracaoFidelidade.cortesNecessarios === 0 &&
                    dadosCliente?.proximoGratis === true;

                  return dados.servicos?.map(s => (
                    <button key={s.id} className={`service-card ${servicoSelecionado===s.id?"active":""}`} onClick={() => setServicoSelecionado(s.id)}>
                      <span className="service-label">{s.label}</span>
                      <span className="service-price">
                        {temGratuidadeReal ? "GRÁTIS" : formatarPreco(s.preco)}
                      </span>
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Grade de dias */}
            <div className="section">
              <h3 className="section-title">Escolha o Dia</h3>
              {diasComVaga.length === 0
                ? <p className="card-sub">Nenhum horário disponível nos próximos dias.</p>
                : (
                  <div className="day-grid">
                    {diasComVaga.map(d => (
                      <button key={dateKey(d)} className={`day-card ${dataSelecionada && dateKey(dataSelecionada)===dateKey(d)?"active":""}`}
                        onClick={() => { setDataSelecionada(d); setHorarioSelecionado(null); }}>
                        <span className="day-name">{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][d.getDay()]}</span>
                        <span className="day-num">{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Grade de horários */}
            {dataSelecionada && (
              <div className="section fade-in">
                <h3 className="section-title">Horários Disponíveis</h3>
                <div className="time-grid">
                  {horariosDisponiveis(dataSelecionada, barbeiroSelecionado).map(h => (
                    <button key={h} className={`time-slot ${horarioSelecionado===h?"active":""}`} onClick={() => setHorarioSelecionado(h)}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ width:"100%", marginTop:24 }}
              disabled={!dataSelecionada || !horarioSelecionado || !servicoSelecionado}
              onClick={() => setEtapaAtual("pagamento")}>
              Continuar →
            </button>
          </div>
        )}

        {/* ── PAGAMENTO ────────────────────────── */}
        {etapaAtual === "pagamento" && (
          <div className="fade-in form-card">
            <h3 className="card-title">Como deseja pagar?</h3>
            <p className="card-sub">
              {dadosCliente?.proximoGratis && configuracaoFidelidade.ativo
                ? "🎁 Este corte é gratuito pelo programa de fidelidade!"
                : `Total: ${formatarPreco(servico?.preco || 0)}`}
            </p>
            <div className="payment-options">
              <button className={`payment-card ${metodoPagamento==="pix"?"active":""}`} onClick={() => setMetodoPagamento("pix")}>
                <span className="payment-icon">📱</span>
                <span className="payment-label">Pagar agora</span>
                <span className="payment-sub">Via PIX</span>
              </button>
              <button className={`payment-card ${metodoPagamento==="presencial"?"active":""}`} onClick={() => setMetodoPagamento("presencial")}>
                <span className="payment-icon">💵</span>
                <span className="payment-label">Pagar na hora</span>
                <span className="payment-sub">Dinheiro / Cartão</span>
              </button>
            </div>
            <div style={{ display:"flex", gap:12, marginTop:24 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={() => setEtapaAtual("servico")}>← Voltar</button>
              <button className="btn-primary" style={{ flex:2 }} disabled={!metodoPagamento} onClick={() => setEtapaAtual("confirmacao")}>Revisar →</button>
            </div>
          </div>
        )}

        {/* ── CONFIRMAÇÃO ──────────────────────── */}
        {etapaAtual === "confirmacao" && (
          <div className="fade-in form-card">
            <h3 className="card-title">Confirmar Agendamento</h3>
            <div className="confirm-card">
              <Row label="Cliente" value={dadosCliente?.nome || formatPhone(telefoneBruto)} />
              <Row label="Telefone" value={formatPhone(telefoneBruto)} />
              <Row label="Barbeiro" value={barbeiroSelecionado?.nome || "—"} />
              <Row label="Serviço" value={servico?.label} />
              <Row label="Data" value={dataSelecionada?.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})} />
              <Row label="Horário" value={horarioSelecionado} />
              <Row label="Pagamento" value={metodoPagamento==="pix" ? "PIX (online)" : "Presencial"} />
              <Row label="Valor" value={dadosCliente?.proximoGratis && configuracaoFidelidade.ativo ? "🎁 Gratuito!" : formatarPreco(servico?.preco||0)} highlight={dadosCliente?.proximoGratis && configuracaoFidelidade.ativo} />
            </div>
            <div style={{ display:"flex", gap:12, marginTop:24 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={() => setEtapaAtual("pagamento")}>← Voltar</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={confirmarAgendamento}>Confirmar ✓</button>
            </div>
          </div>
        )}

        {/* ── CONCLUÍDO ────────────────────────── */}
        {etapaAtual === "concluido" && (
          <div className="fade-in form-card" style={{ textAlign:"center" }}>
            <div className="success-icon">✓</div>
            <h3 className="card-title">Agendado!</h3>
            <p className="card-sub">
              Com <strong>{barbeiroSelecionado?.nome}</strong> em{" "}
              <strong>{dataSelecionada?.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</strong> às <strong>{horarioSelecionado}</strong>.
            </p>

            {/* Exibe PIX inline se pagamento online */}
            {metodoPagamento === "pix" && codigoPix && (
              <div style={{ marginTop:16, padding:16, background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)" }}>
                <p style={{ fontSize:14, marginBottom:8 }}>💰 Pagamento PIX</p>
                <p style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>{dadosCliente?.proximoGratis && configuracaoFidelidade.ativo ? "Corte gratuito — R$ 0,00" : `Valor: ${formatarPreco(servico?.preco||0)}`}</p>
                <p style={{ fontSize:10, wordBreak:"break-all", fontFamily:"monospace", color:"var(--muted-light)" }}>{codigoPix.substring(0, 50)}...</p>
                <button className="btn-primary" style={{ marginTop:12, fontSize:14, padding:"10px 16px" }} onClick={() => navigator.clipboard.writeText(codigoPix)}>
                  Copiar código PIX
                </button>
              </div>
            )}

            {configuracaoFidelidade.ativo && <LoyaltyBadge client={dados.clientes[telefoneBruto]} config={configuracaoFidelidade} agendamentos={dados.agendamentos} />}

            <button className="btn-primary" style={{ marginTop:24, width:"100%" }} onClick={() => setTelaAtual("home")}>
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
