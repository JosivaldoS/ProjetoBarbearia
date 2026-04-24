import "./HomeScreen.css";

/**
 * Componente da tela inicial da Barbearia
 * Exibe o logo, informações da marca e botões de navegação principal
 * 
 * @param {Function} setTelaAtual - Função para alterar a tela atual da aplicação
 */
export default function TelaInicial({ setTelaAtual }) {
  /**
   * Renderiza a interface inicial da aplicação
   * Contém o logo da barbearia e botões para acessar as principais funcionalidades
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
            Botão principal para clientes agendarem horários
            Ao clicar, redireciona para a tela de agendamento (fluxo do cliente)
          */}
          <button 
            className="btn-primary" 
            onClick={() => setTelaAtual("client")}
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
