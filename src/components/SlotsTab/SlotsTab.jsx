import "./SlotsTab.css";

export default function SlotsTab({ data, update }) {
  const allTimes = [];
  for (let h = 8; h <= 19; h += 1) {
    allTimes.push(`${String(h).padStart(2, "0")}:00`);
    allTimes.push(`${String(h).padStart(2, "0")}:30`);
  }

  // Aqui é onde a mágica acontece: quando o usuário clica em um horário, ele é adicionado ou removido da lista de horários disponíveis para aquele dia da semana. A função toggle recebe o dia da semana (dow) e o horário (time) e atualiza o estado do componente usando a função update. Ela verifica se o horário já está na lista de horários disponíveis para aquele dia; se estiver, ele é removido, caso contrário, é adicionado. Depois disso, a lista de horários para aquele dia é ordenada para manter uma ordem consistente.
  const toggle = (dow, time) =>
    update((d) => {
      if (!d.availableSlots[dow]) d.availableSlots[dow] = [];
      const idx = d.availableSlots[dow].indexOf(time);
      if (idx > -1) d.availableSlots[dow].splice(idx, 1);
      else d.availableSlots[dow].push(time);
      d.availableSlots[dow].sort();
      return d;
    });

  return (
    <div>
      <p className="card-sub">Clique nos horários para ativar/desativar por dia da semana.</p>
      {[1, 2, 3, 4, 5, 6].map((dow) => (
        <div key={dow} className="slot-day">
          <h4 className="slot-day-name">
            {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dow]}
          </h4>
          <div className="slot-grid">
            {allTimes.map((t) => {
              const active = (data.availableSlots[dow] || []).includes(t);
              return (
                <button
                  key={t}
                  className={`slot-toggle ${active ? 'active' : ''}`}
                  onClick={() => toggle(dow, t)}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
