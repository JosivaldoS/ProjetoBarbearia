import "./LoyaltyBadge.css";
import { contarCortesReais } from "../../utils/data";

/**
 * BadgeFidelidade — exibe progresso real de fidelidade do cliente.
 *
 * IMPORTANTE: usa contarCortesReais() para exibir apenas cortes
 * efetivamente concluídos. Nunca exibe agendamentos futuros como progresso.
 *
 * @prop {object} cliente      — dados do cliente (telefone, nome, proximoGratis)
 * @prop {object} config       — fidelidadeConfig (ativo, cortesNecessarios)
 * @prop {Array}  agendamentos — lista completa para calcular cortes reais
 */
export default function LoyaltyBadge({ client, config, agendamentos = [] }) {
  if (!config.ativo || !client) return null;

  // Cortes reais = apenas agendamentos com concluido: true (não futuros)
  const cortesReais = contarCortesReais(agendamentos, client.telefone);
  const necessarios = config.cortesNecessarios;

  // Progresso dentro do ciclo atual (ex: 3 de 5)
  const progressoCiclo = cortesReais % necessarios;
  const porcentagem = (progressoCiclo / necessarios) * 100;

  // Gratuidade é real somente se os cortes reais confirmam
  const temGratuidade = client.proximoGratis && cortesReais > 0 && cortesReais % necessarios === 0;

  return (
    <div className="loyalty-badge">
      <div className="loyalty-top">
        <span className="loyalty-title">✂ Fidelidade</span>
        {temGratuidade
          ? <span className="loyalty-free">GRÁTIS DISPONÍVEL!</span>
          : <span className="loyalty-count">{progressoCiclo}/{necessarios} cortes concluídos</span>
        }
      </div>
      <div className="loyalty-bar">
        <div className="loyalty-fill" style={{ width:`${temGratuidade ? 100 : porcentagem}%` }} />
      </div>
      {!temGratuidade && (
        <p className="loyalty-sub">
          Faltam <strong>{necessarios - progressoCiclo}</strong> corte{necessarios - progressoCiclo !== 1 ? "s" : ""} concluídos para o próximo gratuito!
        </p>
      )}
      {/* Informa o total acumulado para transparência */}
      <p className="loyalty-sub" style={{ marginTop:4 }}>
        Total histórico: {cortesReais} corte{cortesReais !== 1 ? "s" : ""} realizados
      </p>
    </div>
  );
}
