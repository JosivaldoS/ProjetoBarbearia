import "./HomeScreen.css";

/**
 * Componente da tela inicial da Barbearia
 * Exibe o logo, informações da marca e botões de navegação principal
 * Suporta Flow B (agendamento direto com barbeiro específico)
 * 
 * @param {Object} dados - Dados globais da aplicação
 * @param {Function} setTelaAtual - Função para alterar a tela atual da aplicação
 * @param {Function} irParaAgendamento - Função para navegar ao agendamento (opcionalmente com barbeiro)
 */
export default function TelaInicial({ dados, setTelaAtual, irParaAgendamento }) {
  /**
   * Renderiza a interface inicial da aplicação
   * Contém o logo da barbearia, botões principais e seleção rápida de barbeiros
   */
  return (
    <div className="home">
      {/* Elemento de fundo decorativo */}
      <div className="home-bg" />
      
      {/* Conteúdo principal da tela inicial */}
      <div className="home-content">
        {/* Seção do logo e informações da marca */}
        <div className="logo-wrap">
          {/* Ícone do logo - tesoura representando barbearia */}
          <span className="logo-scissors">✂</span>
          
          {/* Nome principal da barbearia com destaque no & */}
          <h1 className="logo-text">
            NAVALHA<span className="logo-accent">&</span>CO.
          </h1>
          
          {/* Slogan descrevendo o tipo de estabelecimento */}
          <p className="logo-sub">Barbearia Tradicional</p>
        </div>
        
        {/* Botões de navegação para as principais funcionalidades */}
        <div className="home-buttons">
          {/* 
            Botão principal para clientes agendarem horários (Flow A)
            Ao clicar, redireciona para a tela de agendamento sem barbeiro pré-selecionado
          */}
          <button 
            className="btn-primary" 
            onClick={() => irParaAgendamento(null)}
          > 
            <span>Agendar Horário</span>
            {/* Indicador visual de que o botão leva para outra tela */}
            <span className="btn-arrow">→</span>
          </button>
          
          {/* 
            Botão secundário para acesso ao painel do barbeiro
            Ao clicar, redireciona para a tela administrativa (requer autenticação)
          */}
          <button 
            className="btn-ghost" 
            onClick={() => setTelaAtual("barber")}
          >
            Painel do Barbeiro
          </button>
        </div>

        {/* Seleção rápida de barbeiro (Flow B) - admin não aparece aqui */}
        {dados.barbeiros?.filter(b => !b.eAdmin).length > 0 && (
          <div className="barber-quick">
            <p className="barber-quick-title">Agendar com barbeiro específico:</p>
            <div className="barber-quick-grid">
              {dados.barbeiros.filter(b => !b.eAdmin).map(b => (
                <button 
                  key={b.id} 
                  className="btn-barber" 
                  onClick={() => irParaAgendamento(b)}
                >
                  <span className="barber-avatar">{b.nome.charAt(0)}</span>
                  <span>{b.nome}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Elemento decorativo rodapé com ano de fundação */}
      <div className="home-decor">
        {/* Linha decorativa esquerda */}
        <div className="decor-line" />
        
        {/* Ano de fundação da barbearia */}
        <span className="decor-text">EST. 2024</span>
        
        {/* Linha decorativa direita */}
        <div className="decor-line" />
      </div>
    </div>
  );
}
