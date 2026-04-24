import { formatPhone, contarCortesReais } from "../../utils/data";
import "./LoyaltyTab.css";

/**
 * AbaFidelidade — configuração do programa e visão real do progresso dos clientes.
 *
 * MUDANÇA CRÍTICA: o progresso agora é calculado a partir de
 * contarCortesReais() — apenas agendamentos com concluido===true contam.
 * O botão "+corte manual" foi removido pois criava uma brecha de fraude
 * onde o administrador poderia inflar contadores sem cortes reais.
 */
export default function LoyaltyTab({ dados, atualizarDados }) {
  const cfg = dados.fidelidadeConfig;

  return (
    <div className="form-card">
      <h3 className="card-title">⭐ Programa de Fidelidade</h3>

      {/* Toggle ativo/inativo */}
      <div className="toggle-row">
        <span className="row-label">Ativar Fidelidade</span>
        <button className={`toggle ${cfg.ativo?"on":""}`} onClick={() => atualizarDados(d => { d.fidelidadeConfig.ativo = !d.fidelidadeConfig.ativo; return d; })}>
          <span className="toggle-knob" />
        </button>
      </div>

      {cfg.ativo && (
        <>
          <div className="row">
            <span className="row-label">Cortes concluídos para ganhar 1 grátis</span>
            <div className="counter">
              <button className="btn-sm" onClick={() => atualizarDados(d => { if(d.fidelidadeConfig.cortesNecessarios>2) d.fidelidadeConfig.cortesNecessarios--; return d; })}>−</button>
              <span className="counter-val">{cfg.cortesNecessarios}</span>
              <button className="btn-sm" onClick={() => atualizarDados(d => { d.fidelidadeConfig.cortesNecessarios++; return d; })}>+</button>
            </div>
          </div>
          <p className="card-sub">
            A cada <strong>{cfg.cortesNecessarios}</strong> cortes <em>concluídos</em>, o próximo é gratuito.
            Apenas agendamentos marcados como concluídos pelo barbeiro contam.
          </p>
        </>
      )}

      {/* Progresso real de cada cliente */}
      <h3 className="section-title" style={{ marginTop:32 }}>Progresso dos Clientes</h3>
      <p className="card-sub" style={{ marginBottom:16 }}>
        Contagem baseada exclusivamente em cortes concluídos pelo barbeiro.
      </p>

      {Object.values(dados.clientes).map(c => {
        // Calcula cortes reais a partir dos agendamentos — não do campo denormalizado
        const cortesReais = contarCortesReais(dados.agendamentos, c.telefone);
        const progressoCiclo = cortesReais % cfg.cortesNecessarios;
        // Verifica gratuidade real (cortes concluídos atingiram o limiar)
        const temGratuidadeReal = c.proximoGratis &&
          cortesReais > 0 &&
          cortesReais % cfg.cortesNecessarios === 0;

        return (
          <div key={c.telefone} className="loyalty-row">
            <div style={{ flex:1 }}>
              <span className="ap-phone">{c.nome || "—"}</span>
              <span className="card-sub" style={{ display:"block" }}>
                {formatPhone(c.telefone)} · {cortesReais} corte{cortesReais!==1?"s":""} concluídos
              </span>
              {/* Barra de progresso visual */}
              {cfg.ativo && (
                <div className="loyalty-bar" style={{ marginTop:6, height:4 }}>
                  <div className="loyalty-fill" style={{
                    width:`${temGratuidadeReal ? 100 : (progressoCiclo/cfg.cortesNecessarios)*100}%`
                  }} />
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:12, flexShrink:0 }}>
              {temGratuidadeReal && <span className="free-badge">GRÁTIS ✓</span>}
              {cfg.ativo && !temGratuidadeReal && (
                <span className="card-sub">
                  {progressoCiclo}/{cfg.cortesNecessarios}
                </span>
              )}
              {/* Botão para redefinir gratuidade caso o cliente já tenha usado */}
              {c.proximoGratis && !temGratuidadeReal && (
                <button
                  className="btn-sm-danger"
                  title="Corrigir: marcar gratuidade como usada (os cortes reais não confirmam esta gratuidade)"
                  onClick={() => atualizarDados(d => {
                    const cl = d.clientes[c.telefone];
                    if (cl) cl.proximoGratis = false;
                    return d;
                  })}
                >
                  Corrigir
                </button>
              )}
            </div>
          </div>
        );
      })}

      {Object.keys(dados.clientes).length === 0 && <div className="empty">Nenhum cliente cadastrado ainda.</div>}
    </div>
  );
}
