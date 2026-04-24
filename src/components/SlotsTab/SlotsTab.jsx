import "./SlotsTab.css";

/**
 * AbaHorarios — configuração de horários do barbeiro logado.
 * Cada barbeiro tem agenda independente.
 */
export default function SlotsTab({ dados, atualizarDados, barbeiro }) {
  const alternar = (dia, horario) => atualizarDados(d => {
    if (!d.horariosPorBarbeiro[barbeiro.id])
      d.horariosPorBarbeiro[barbeiro.id] = structuredClone(d.horariosGlobais);
    const cfg = d.horariosPorBarbeiro[barbeiro.id];
    if (!cfg[dia]) cfg[dia] = [];
    const idx = cfg[dia].indexOf(horario);
    if (idx > -1) cfg[dia].splice(idx, 1);
    else { cfg[dia].push(horario); cfg[dia].sort(); }
    return d;
  });

  const ativos = dia => dados.horariosPorBarbeiro?.[barbeiro.id]?.[dia] || dados.horariosGlobais?.[dia] || [];

  return (
    <div>
      <p className="card-sub">Configure seus horários de atendimento. Clique para ativar/desativar.</p>
      {[1,2,3,4,5,6].map(dia => (
        <div key={dia} className="slot-day">
          <h4 className="slot-day-name">{["","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][dia]}</h4>
          <div className="slot-grid">
            {ativos(dia).map(h => (
              <button key={h} className={`slot-toggle active`} onClick={() => alternar(dia, h)}>{h}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
