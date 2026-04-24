import { useState, useEffect } from "react";
import { loadData, saveData, defaultData } from "./utils/data";
import TelaInicial from "./components/HomeScreen/HomeScreen";
import FluxoCliente from "./components/ClientFlow/ClientFlow";
import PainelBarbeiro from "./components/BarberPanel/BarberPanel";

/**
 * Componente principal da aplicação Barbearia
 * Gerencia o estado global, navegação entre telas e persistência de dados
 */
export default function App() {
  // Estado global contendo todos os dados da aplicação (clientes, agendamentos, etc.)
  const [dadosAplicacao, setDadosAplicacao] = useState(defaultData);
  
  // Controla qual tela está sendo exibida: 'home', 'client' ou 'barber'
  const [telaAtual, setTelaAtual] = useState("home");
  
  // Indica se o barbeiro está autenticado no painel administrativo
  const [barbeiroAutenticado, setBarbeiroAutenticado] = useState(false);
  
  // Estado de carregamento enquanto os dados são carregados do storage
  const [carregando, setCarregando] = useState(true);

  /**
   * Efeito executado ao montar o componente
   * Carrega os dados salvos (localStorage/Supabase) e atualiza o estado
   */
  useEffect(() => {
    const inicializarAplicacao = async () => {
      try {
        // Tenta carregar dados persistidos, usa dados padrão se falhar
        const dadosCarregados = await loadData();
        setDadosAplicacao(dadosCarregados);
      } catch (erro) {
        console.error("Erro ao carregar dados da aplicação:", erro);
      } finally {
        // Finaliza o estado de carregamento independentemente do resultado
        setCarregando(false);
      }
    };
    inicializarAplicacao();
  }, []);

  /**
   * Função wrapper para atualizar o estado de forma imutável
   * Garante que os dados sejam clonados antes da modificação e salvos após
   * @param {Function} funcaoAtualizacao - Função que recebe os dados atuais e retorna os dados atualizados
   */
  const atualizarDados = (funcaoAtualizacao) => setDadosAplicacao((dadosAnteriores) => {
    // Cria uma cópia profunda para evitar mutação direta do estado
    const dadosAtualizados = funcaoAtualizacao(structuredClone(dadosAnteriores));
    
    // Persiste as alterações no storage (localStorage/Supabase)
    saveData(dadosAtualizados);
    
    return dadosAtualizados;
  });

  // Tela de carregamento enquanto os dados são inicializados
  if (carregando) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontSize: "18px" }}>
        Carregando aplicação...
      </div>
    );
  }

  /**
   * Renderização condicional baseada na tela atual
   * Cada tela recebe os props necessários para seu funcionamento
   */
  return (
    <div>
      {/* Tela inicial - Boas-vindas e navegação principal */}
      {telaAtual === "home" && <TelaInicial setTelaAtual={setTelaAtual} />}
      
      {/* Tela do cliente - Fluxo completo de agendamento */}
      {telaAtual === "client" && (
        <FluxoCliente 
          dados={dadosAplicacao} 
          atualizarDados={atualizarDados} 
          setTelaAtual={setTelaAtual} 
        />
      )}
      
      {/* Tela do barbeiro - Painel administrativo com autenticação */}
      {telaAtual === "barber" && (
        <PainelBarbeiro
          dados={dadosAplicacao}
          atualizarDados={atualizarDados}
          setTelaAtual={setTelaAtual}
          autenticado={barbeiroAutenticado}
          setAutenticado={setBarbeiroAutenticado}
        />
      )}
    </div>
  );
}
